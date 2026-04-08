import { Injectable } from '@nestjs/common';
import { AuditActionType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

export interface CreateAuditLogInput {
  actorUserId: string;
  actionType: AuditActionType;
  targetEntityId: string;
  summary: string;
}

type AuditLogWriter =
  | Pick<PrismaService, 'auditLog'>
  | Prisma.TransactionClient;

@Injectable()
export class AuditLogsService {
  constructor(private readonly prismaService: PrismaService) {}

  // === get audit logs ===
  async findAll(query: Partial<AuditLogQueryDto> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      actionType: query.actionType,
      targetEntityId: query.targetEntityId,
    };

    const [totalItems, items] = await Promise.all([
      this.prismaService.auditLog.count({ where }),
      this.prismaService.auditLog.findMany({
        where,
        skip,
        take: limit,
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
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
      },
    };
  }

  // === create task log ===
  createTaskLog(
    input: CreateAuditLogInput,
    writer: AuditLogWriter = this.prismaService,
  ) {
    // === task logs always use the task target entity ===
    return writer.auditLog.create({
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
