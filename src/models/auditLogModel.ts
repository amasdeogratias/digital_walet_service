import { model, Schema } from 'mongoose';

const auditLogSchema = new Schema(
  {
    actorUserId: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    status: { type: String, enum: ['success', 'failed'], required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

export const AuditLogModel = model('AuditLog', auditLogSchema);
