import { model, Schema } from 'mongoose';
import { TopUpRequestStatuses } from '../config/constants';

const topUpRequestSchema = new Schema(
  {
    requesterUserId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    reason: { type: String },
    status: {
      type: String,
      enum: Object.values(TopUpRequestStatuses),
      default: TopUpRequestStatuses.PENDING,
      index: true
    },
    reviewedByUserId: { type: String },
    reviewedAt: { type: Date }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const TopUpRequestModel = model('TopUpRequest', topUpRequestSchema);
