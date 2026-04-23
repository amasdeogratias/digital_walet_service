import { AuditLogRepository } from '../repositories/mongo/auditLogRepository';

export class AuditService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  public async listRecent(limit = 50) {
    return this.auditLogRepository.listRecent(limit);
  }
}
