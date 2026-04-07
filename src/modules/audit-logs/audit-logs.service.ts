import { Injectable } from '@nestjs/common';
import { AuditActionType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

export interface CreateAuditLogInput {
  actorUserId: string;
  actionType: AuditActionType;
  targetEntityId: string;
  summary: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(query: AuditLogQueryDto) {
    return this.prismaService.auditLog.findMany({
      where: {
        actionType: query.actionType,
        targetEntityId: query.targetEntityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        actorUserId: true,
        actionType: true,
        targetEntity: true,
        targetEntityId: true,
        summary: true,
        createdAt: true,
        actorUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

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
