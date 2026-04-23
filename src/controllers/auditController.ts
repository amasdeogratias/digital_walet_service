import { Request, Response } from 'express';
import { AuditService } from '../services/auditService';

export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  public listRecent = async (request: Request, response: Response): Promise<void> => {
    const limit = request.query.limit ? Number(request.query.limit) : 50;
    const result = await this.auditService.listRecent(limit);
    response.status(200).json(result);
  };
}
