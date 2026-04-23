import { TopUpRequestStatuses } from "../../../../wallet_service/src/config/constants";
import { AppError } from "../../../../wallet_service/src/errors/AppError";
import { TopUpRequestModel } from "../../../../wallet_service/src/models/topUpRequestModel";
import { TopUpRequestRecord } from "../../../../wallet_service/src/types/domain";

const mapTopUpRequest = (item: {
  _id: { toString(): string };
  requesterUserId: string;
  amount: number;
  currency: string;
  reason?: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedByUserId?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): TopUpRequestRecord => ({
  id: item._id.toString(),
  requesterUserId: item.requesterUserId,
  amount: item.amount,
  currency: item.currency,
  reason: item.reason ?? undefined,
  status: item.status,
  reviewedByUserId: item.reviewedByUserId ?? undefined,
  reviewedAt: item.reviewedAt ?? undefined,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export class TopUpRequestRepository {
  public async create(input: {
    requesterUserId: string;
    amount: number;
    currency: string;
    reason?: string;
  }): Promise<TopUpRequestRecord> {
    const item = await TopUpRequestModel.create({
      requesterUserId: input.requesterUserId,
      amount: input.amount,
      currency: input.currency,
      reason: input.reason,
    });

    return mapTopUpRequest(item.toObject());
  }

  public async findById(id: string): Promise<TopUpRequestRecord | null> {
    const item = await TopUpRequestModel.findById(id).lean();
    return item ? mapTopUpRequest(item as never) : null;
  }

  public async listPending(): Promise<TopUpRequestRecord[]> {
    const items = await TopUpRequestModel.find({
      status: TopUpRequestStatuses.PENDING,
    })
      .sort({ createdAt: -1 })
      .lean();
    return items.map((item) => mapTopUpRequest(item as never));
  }

  public async markApproved(
    id: string,
    reviewedByUserId: string,
  ): Promise<TopUpRequestRecord> {
    const item = await TopUpRequestModel.findOneAndUpdate(
      {
        _id: id,
        status: TopUpRequestStatuses.PENDING,
      },
      {
        $set: {
          status: TopUpRequestStatuses.APPROVED,
          reviewedByUserId,
          reviewedAt: new Date(),
        },
      },
      { new: true },
    ).lean();

    if (!item) {
      throw new AppError(409, "Top-up request is no longer pending");
    }

    return mapTopUpRequest(item as never);
  }
}
