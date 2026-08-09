import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type CreateAuditRecord = {
  organizationId: string;
  actorUserId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(record: CreateAuditRecord) {
    return this.prisma.auditLog.create({ data: record });
  }
}
