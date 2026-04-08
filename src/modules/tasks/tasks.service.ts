import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditActionType, Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TasksQueryDto } from './dto/tasks-query.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  assignedUserId: true,
  createdAt: true,
  updatedAt: true,
  assignedUser: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.TaskSelect;

type TaskRecord = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;
type TaskWriter =
  | Pick<PrismaService, 'task' | 'user'>
  | Prisma.TransactionClient;

@Injectable()
export class TasksService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // === create task ===
  async create(actorUserId: string, createTaskDto: CreateTaskDto) {
    return this.prismaService.$transaction(async (tx) => {
      // === validate assigned user before create ===
      await this.ensureAssignedUserExists(tx, createTaskDto.assignedUserId);

      const createdTask = await tx.task.create({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          status: createTaskDto.status ?? TaskStatus.PENDING,
          assignedUserId: createTaskDto.assignedUserId ?? null,
        },
        select: taskSelect,
      });

      // === create audit logs for task creation and assignment ===
      await this.auditLogsService.createTaskLog(
        {
          actorUserId,
          actionType: AuditActionType.TASK_CREATED,
          targetEntityId: createdTask.id,
          summary: `Task "${createdTask.title}" created`,
        },
        tx,
      );

      if (createdTask.assignedUserId) {
        await this.auditLogsService.createTaskLog(
          {
            actorUserId,
            actionType: AuditActionType.TASK_ASSIGNED,
            targetEntityId: createdTask.id,
            summary: `Task "${createdTask.title}" assigned to user "${createdTask.assignedUser?.name}"`,
          },
          tx,
        );
      }

      return createdTask;
    });
  }

  // === get all tasks ===
  async findAll(query: Partial<TasksQueryDto> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [totalItems, items] = await Promise.all([
      this.prismaService.task.count(),
      this.prismaService.task.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: taskSelect,
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

  // === get my tasks ===
  async findAssignedTasks(userId: string, query: Partial<TasksQueryDto> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = { assignedUserId: userId };

    const [totalItems, items] = await Promise.all([
      this.prismaService.task.count({ where }),
      this.prismaService.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: taskSelect,
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

  // === get task by id ===
  async findOne(id: string) {
    const task = await this.prismaService.task.findUnique({
      where: { id },
      select: taskSelect,
    });

    if (!task) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    return task;
  }

  // === get my task by id ===
  async findAssignedTaskById(userId: string, id: string) {
    const task = await this.prismaService.task.findFirst({
      where: {
        id,
        assignedUserId: userId,
      },
      select: taskSelect,
    });

    if (!task) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }

    return task;
  }

  // === update task ===
  async update(actorUserId: string, id: string, updateTaskDto: UpdateTaskDto) {
    return this.prismaService.$transaction(async (tx) => {
      const existingTask = await this.findOne(id);
      await this.ensureAssignedUserExists(tx, updateTaskDto.assignedUserId);

      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          title: updateTaskDto.title,
          description: updateTaskDto.description,
          status: updateTaskDto.status,
          assignedUserId: updateTaskDto.assignedUserId,
        },
        select: taskSelect,
      });

      await this.logAdminTaskUpdate(actorUserId, existingTask, updatedTask, tx);

      return updatedTask;
    });
  }

  // === update my task status ===
  async updateAssignedTaskStatus(
    actorUserId: string,
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    return this.prismaService.$transaction(async (tx) => {
      // === validate task ownership before status update ===
      const existingTask = await this.findAssignedTaskById(actorUserId, id);

      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          status: updateTaskStatusDto.status,
        },
        select: taskSelect,
      });

      await this.auditLogsService.createTaskLog(
        {
          actorUserId,
          actionType: AuditActionType.TASK_STATUS_CHANGED,
          targetEntityId: updatedTask.id,
          summary: `Task "${updatedTask.title}" status changed from "${existingTask.status}" to "${updatedTask.status}"`,
        },
        tx,
      );

      return updatedTask;
    });
  }

  // === delete task ===
  async remove(actorUserId: string, id: string) {
    return this.prismaService.$transaction(async (tx) => {
      await this.findOne(id);

      const deletedTask = await tx.task.delete({
        where: { id },
        select: taskSelect,
      });

      await this.auditLogsService.createTaskLog(
        {
          actorUserId,
          actionType: AuditActionType.TASK_DELETED,
          targetEntityId: deletedTask.id,
          summary: `Task "${deletedTask.title}" deleted`,
        },
        tx,
      );

      return deletedTask;
    });
  }

  // === validate assigned user ===
  private async ensureAssignedUserExists(
    writer: TaskWriter,
    assignedUserId?: string | null,
  ) {
    if (!assignedUserId) {
      return;
    }

    const assignedUser = await writer.user.findUnique({
      where: { id: assignedUserId },
      select: { id: true },
    });

    if (!assignedUser) {
      throw new NotFoundException(
        `Assigned user with id "${assignedUserId}" not found`,
      );
    }
  }

  private async logAdminTaskUpdate(
    actorUserId: string,
    existingTask: TaskRecord,
    updatedTask: TaskRecord,
    writer: Prisma.TransactionClient,
  ) {
    // === create audit logs for admin task updates ===
    if (
      existingTask.title !== updatedTask.title ||
      existingTask.description !== updatedTask.description
    ) {
      await this.auditLogsService.createTaskLog(
        {
          actorUserId,
          actionType: AuditActionType.TASK_UPDATED,
          targetEntityId: updatedTask.id,
          summary: `Task "${updatedTask.title}" details updated`,
        },
        writer,
      );
    }

    if (existingTask.assignedUserId !== updatedTask.assignedUserId) {
      await this.auditLogsService.createTaskLog(
        {
          actorUserId,
          actionType: AuditActionType.TASK_ASSIGNED,
          targetEntityId: updatedTask.id,
          summary: `Task "${updatedTask.title}" assignment changed`,
        },
        writer,
      );
    }

    if (existingTask.status !== updatedTask.status) {
      await this.auditLogsService.createTaskLog(
        {
          actorUserId,
          actionType: AuditActionType.TASK_STATUS_CHANGED,
          targetEntityId: updatedTask.id,
          summary: `Task "${updatedTask.title}" status changed from "${existingTask.status}" to "${updatedTask.status}"`,
        },
        writer,
      );
    }
  }
}
