import { randomUUID } from 'crypto';
import { LedgerEntryTypes, Roles } from '../config/constants';
import { env } from '../config/env';
import { withTransaction } from '../database/postgres';
import { AppError } from '../errors/AppError';
import { AuditLogRepository } from '../repositories/mongo/auditLogRepository';
import { TopUpRequestRepository } from '../repositories/mongo/topUpRequestRepository';
import { LedgerRepository } from '../repositories/postgres/ledgerRepository';
import { UserRepository } from '../repositories/postgres/userRepository';
import { WalletRepository } from '../repositories/postgres/walletRepository';
import { AuthContext, TopUpRequestRecord, WalletRecord } from '../types/domain';

interface WalletSummary {
  wallet: WalletRecord;
  recentTransactions: {
    id: string;
    type: 'top_up' | 'transfer';
    amount: number;
    currency: string;
    reference: string;
    description: string | null;
    createdAt: Date;
  }[];
}

export class WalletService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
    private readonly ledgerRepository: LedgerRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly topUpRequestRepository: TopUpRequestRepository
  ) {}

  public async getWalletSummary(requestingUser: AuthContext, targetUserId?: string): Promise<WalletSummary> {
    const userId = targetUserId && requestingUser.role === Roles.ADMIN ? targetUserId : requestingUser.userId;
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new AppError(404, 'Wallet not found');
    }

    const recentTransactions = await this.ledgerRepository.findRecentForWallet(wallet.id);
    return {
      wallet,
      recentTransactions: recentTransactions.map((item) => ({
        id: item.id,
        type: item.type,
        amount: item.amount,
        currency: item.currency,
        reference: item.reference,
        description: item.description,
        createdAt: item.createdAt
      }))
    };
  }

  public async adminTopUp(
    actor: AuthContext,
    input: { userId: string; amount: number; reason?: string },
    idempotencyKey?: string
  ): Promise<{ wallet: WalletRecord; reference: string; replayed: boolean }> {
    if (actor.role !== Roles.ADMIN) {
      throw new AppError(403, 'Only admins can top up wallets');
    }

    if (input.amount <= 0) {
      throw new AppError(400, 'Top-up amount must be greater than zero');
    }

    const reference = idempotencyKey
      ? `topup:${input.userId}:${idempotencyKey}`
      : `topup:${input.userId}:${randomUUID()}`;

    const result = await withTransaction(async (db) => {
      const existingEntry = await this.ledgerRepository.findByReference(reference, db);
      if (existingEntry?.receiverWalletId) {
        const existingWallet = await this.walletRepository.findByUserId(input.userId, db);
        if (!existingWallet) {
          throw new AppError(404, 'Wallet not found');
        }

        return {
          wallet: existingWallet,
          reference,
          replayed: true
        };
      }

      const user = await this.userRepository.findById(input.userId, db);
      if (!user) {
        throw new AppError(404, 'Recipient user not found');
      }

      const [wallet] = await this.walletRepository.getWalletsByUserIdsForUpdate([input.userId], db);
      if (!wallet) {
        throw new AppError(404, 'Wallet not found');
      }

      const updatedWallet = await this.walletRepository.updateBalance(wallet.id, wallet.balance + input.amount, db);
      await this.ledgerRepository.createEntry(
        {
          type: LedgerEntryTypes.TOP_UP,
          amount: input.amount,
          currency: updatedWallet.currency,
          senderWalletId: null,
          receiverWalletId: updatedWallet.id,
          reference,
          idempotencyKey: idempotencyKey ?? null,
          description: input.reason ?? 'Admin top-up',
          metadata: {
            actorUserId: actor.userId,
            targetUserId: input.userId
          }
        },
        db
      );

      return {
        wallet: updatedWallet,
        reference,
        replayed: false
      };
    });

    await this.auditLogRepository.create({
      actorUserId: actor.userId,
      action: 'wallet_top_up',
      entityType: 'wallet',
      entityId: result.wallet.id,
      status: 'success',
      metadata: {
        amount: input.amount,
        targetUserId: input.userId,
        reference: result.reference,
        replayed: result.replayed
      }
    });

    return result;
  }

  public async transfer(
    actor: AuthContext,
    input: { recipientUserId: string; amount: number; note?: string },
    idempotencyKey?: string
  ): Promise<{ senderWallet: WalletRecord; receiverWallet: WalletRecord; reference: string; replayed: boolean }> {
    if (actor.userId === input.recipientUserId) {
      throw new AppError(400, 'You cannot transfer funds to yourself');
    }

    if (input.amount < env.transferMinAmount || input.amount > env.transferMaxAmount) {
      throw new AppError(
        400,
        `Transfer amount must be between ${env.transferMinAmount} and ${env.transferMaxAmount}`
      );
    }

    const reference = idempotencyKey
      ? `transfer:${actor.userId}:${input.recipientUserId}:${idempotencyKey}`
      : `transfer:${actor.userId}:${input.recipientUserId}:${randomUUID()}`;

    const result = await withTransaction(async (db) => {
      const existingEntry = await this.ledgerRepository.findByReference(reference, db);
      if (existingEntry?.senderWalletId && existingEntry.receiverWalletId) {
        const wallets = await this.walletRepository.getWalletsByUserIdsForUpdate([actor.userId, input.recipientUserId], db);
        const senderWallet = wallets.find((wallet) => wallet.userId === actor.userId);
        const receiverWallet = wallets.find((wallet) => wallet.userId === input.recipientUserId);

        if (!senderWallet || !receiverWallet) {
          throw new AppError(404, 'One of the wallets could not be found');
        }

        return { senderWallet, receiverWallet, reference, replayed: true };
      }

      const users = await Promise.all([
        this.userRepository.findById(actor.userId, db),
        this.userRepository.findById(input.recipientUserId, db)
      ]);

      if (!users[0] || !users[1]) {
        throw new AppError(404, 'Sender or recipient user could not be found');
      }

      const wallets = await this.walletRepository.getWalletsByUserIdsForUpdate([actor.userId, input.recipientUserId], db);
      const senderWallet = wallets.find((wallet) => wallet.userId === actor.userId);
      const receiverWallet = wallets.find((wallet) => wallet.userId === input.recipientUserId);

      if (!senderWallet || !receiverWallet) {
        throw new AppError(404, 'Sender or recipient wallet could not be found');
      }

      if (senderWallet.balance < input.amount) {
        throw new AppError(409, 'Insufficient wallet balance');
      }

      const updatedSender = await this.walletRepository.updateBalance(senderWallet.id, senderWallet.balance - input.amount, db);
      const updatedReceiver = await this.walletRepository.updateBalance(
        receiverWallet.id,
        receiverWallet.balance + input.amount,
        db
      );

      await this.ledgerRepository.createEntry(
        {
          type: LedgerEntryTypes.TRANSFER,
          amount: input.amount,
          currency: updatedSender.currency,
          senderWalletId: updatedSender.id,
          receiverWalletId: updatedReceiver.id,
          reference,
          idempotencyKey: idempotencyKey ?? null,
          description: input.note ?? 'Wallet transfer',
          metadata: {
            senderUserId: actor.userId,
            recipientUserId: input.recipientUserId
          }
        },
        db
      );

      return {
        senderWallet: updatedSender,
        receiverWallet: updatedReceiver,
        reference,
        replayed: false
      };
    });

    await this.auditLogRepository.create({
      actorUserId: actor.userId,
      action: 'wallet_transfer',
      entityType: 'wallet_transfer',
      entityId: result.reference,
      status: 'success',
      metadata: {
        amount: input.amount,
        recipientUserId: input.recipientUserId,
        replayed: result.replayed
      }
    });

    return result;
  }

  public async createTopUpRequest(
    actor: AuthContext,
    input: { amount: number; reason?: string }
  ): Promise<TopUpRequestRecord> {
    if (input.amount <= 0) {
      throw new AppError(400, 'Top-up request amount must be greater than zero');
    }

    const request = await this.topUpRequestRepository.create({
      requesterUserId: actor.userId,
      amount: input.amount,
      currency: env.defaultCurrency,
      reason: input.reason
    });

    await this.auditLogRepository.create({
      actorUserId: actor.userId,
      action: 'top_up_request_created',
      entityType: 'top_up_request',
      entityId: request.id,
      status: 'success',
      metadata: { amount: input.amount }
    });

    return request;
  }

  public async listPendingTopUpRequests(): Promise<TopUpRequestRecord[]> {
    return this.topUpRequestRepository.listPending();
  }

  public async approveTopUpRequest(
    actor: AuthContext,
    requestId: string
  ): Promise<{ request: TopUpRequestRecord; wallet: WalletRecord; reference: string }> {
    if (actor.role !== Roles.ADMIN) {
      throw new AppError(403, 'Only admins can approve top-up requests');
    }

    const request = await this.topUpRequestRepository.findById(requestId);
    if (!request) {
      throw new AppError(404, 'Top-up request not found');
    }

    const topUpResult = await this.adminTopUp(
      actor,
      {
        userId: request.requesterUserId,
        amount: request.amount,
        reason: `Approved top-up request ${request.id}`
      },
      request.id
    );

    const approvedRequest = await this.topUpRequestRepository.markApproved(request.id, actor.userId);
    return {
      request: approvedRequest,
      wallet: topUpResult.wallet,
      reference: topUpResult.reference
    };
  }
}
