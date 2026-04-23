import { AuditLogModel } from "../../models/auditLogModel";
import { AuditLogRecord } from "../../types/domain";

export class AuditLogRepository {
  public async create(log: AuditLogRecord): Promise<void> {
    try {
      await AuditLogModel.create(log);
    } catch (error) {
      console.warn(
        JSON.stringify({
          message: "Audit log write failed",
          log,
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    }
  }

  public async listRecent(limit = 50): Promise<AuditLogRecord[]> {
    const items = await AuditLogModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return items.map((item) => ({
      actorUserId: item.actorUserId,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      status: item.status,
      metadata: item.metadata,
    }));
  }
}
