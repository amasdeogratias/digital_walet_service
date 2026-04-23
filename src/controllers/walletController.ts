import { Request, Response } from 'express';
import { WalletService } from '../services/walletService';
import { getIdempotencyKey } from '../utils/http';

export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  public getMyWallet = async (request: Request, response: Response): Promise<void> => {
    const result = await this.walletService.getWalletSummary(request.auth!, request.query.userId?.toString());
    response.status(200).json(result);
  };

  public adminTopUp = async (request: Request, response: Response): Promise<void> => {
    const result = await this.walletService.adminTopUp(request.auth!, request.body, getIdempotencyKey(request));
    response.status(result.replayed ? 200 : 201).json(result);
  };

  public transfer = async (request: Request, response: Response): Promise<void> => {
    const result = await this.walletService.transfer(request.auth!, request.body, getIdempotencyKey(request));
    response.status(result.replayed ? 200 : 201).json(result);
  };

  public createTopUpRequest = async (request: Request, response: Response): Promise<void> => {
    const result = await this.walletService.createTopUpRequest(request.auth!, request.body);
    response.status(201).json(result);
  };

  public listPendingTopUpRequests = async (_request: Request, response: Response): Promise<void> => {
    const result = await this.walletService.listPendingTopUpRequests();
    response.status(200).json(result);
  };

  public approveTopUpRequest = async (request: Request, response: Response): Promise<void> => {
    const requestId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const result = await this.walletService.approveTopUpRequest(request.auth!, requestId);
    response.status(200).json(result);
  };
}
