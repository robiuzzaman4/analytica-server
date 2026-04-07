import { Injectable } from '@nestjs/common';
import { AuditActionType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CreateAuditLogInput {
  actorUserId: string;
  actionType: AuditActionType;
  targetEntityId: string;
  summary: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prismaService: PrismaService) {}

  createTaskLog(input: CreateAuditLogInput) {
    return this.prismaService.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        actionType: input.actionType,
        targetEntity: 'TASK',
        targetEntityId: input.targetEntityId,
        summary: input.summary,
      },
    });
  }
}
