import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditActionType, Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateTaskDto } from './dto/create-task.dto';
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

@Injectable()
export class TasksService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(actorUserId: string, createTaskDto: CreateTaskDto) {
    await this.ensureAssignedUserExists(createTaskDto.assignedUserId);

    const createdTask = await this.prismaService.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status ?? TaskStatus.PENDING,
        assignedUserId: createTaskDto.assignedUserId ?? null,
      },
      select: taskSelect,
    });

    await this.auditLogsService.createTaskLog({
      actorUserId,
      actionType: AuditActionType.TASK_CREATED,
      targetEntityId: createdTask.id,
      summary: `Task "${createdTask.title}" created`,
    });

    if (createdTask.assignedUserId) {
      await this.auditLogsService.createTaskLog({
        actorUserId,
        actionType: AuditActionType.TASK_ASSIGNED,
        targetEntityId: createdTask.id,
        summary: `Task "${createdTask.title}" assigned to user "${createdTask.assignedUserId}"`,
      });
    }

    return createdTask;
  }

  findAll() {
    return this.prismaService.task.findMany({
      orderBy: { createdAt: 'desc' },
      select: taskSelect,
    });
  }

  findAssignedTasks(userId: string) {
    return this.prismaService.task.findMany({
      where: { assignedUserId: userId },
      orderBy: { createdAt: 'desc' },
      select: taskSelect,
    });
  }

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

  async update(actorUserId: string, id: string, updateTaskDto: UpdateTaskDto) {
    const existingTask = await this.findOne(id);
    await this.ensureAssignedUserExists(updateTaskDto.assignedUserId);

    const updatedTask = await this.prismaService.task.update({
      where: { id },
      data: {
        title: updateTaskDto.title,
        description: updateTaskDto.description,
        status: updateTaskDto.status,
        assignedUserId: updateTaskDto.assignedUserId,
      },
      select: taskSelect,
    });

    await this.logAdminTaskUpdate(actorUserId, existingTask, updatedTask);

    return updatedTask;
  }

  async updateAssignedTaskStatus(
    actorUserId: string,
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    const existingTask = await this.findAssignedTaskById(actorUserId, id);

    const updatedTask = await this.prismaService.task.update({
      where: { id },
      data: {
        status: updateTaskStatusDto.status,
      },
      select: taskSelect,
    });

    await this.auditLogsService.createTaskLog({
      actorUserId,
      actionType: AuditActionType.TASK_STATUS_CHANGED,
      targetEntityId: updatedTask.id,
      summary: `Task "${updatedTask.title}" status changed from "${existingTask.status}" to "${updatedTask.status}"`,
    });

    return updatedTask;
  }

  async remove(actorUserId: string, id: string) {
    await this.findOne(id);

    const deletedTask = await this.prismaService.task.delete({
      where: { id },
      select: taskSelect,
    });

    await this.auditLogsService.createTaskLog({
      actorUserId,
      actionType: AuditActionType.TASK_DELETED,
      targetEntityId: deletedTask.id,
      summary: `Task "${deletedTask.title}" deleted`,
    });

    return deletedTask;
  }

  private async ensureAssignedUserExists(assignedUserId?: string | null) {
    if (!assignedUserId) {
      return;
    }

    const assignedUser = await this.prismaService.user.findUnique({
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
  ) {
    if (
      existingTask.title !== updatedTask.title ||
      existingTask.description !== updatedTask.description
    ) {
      await this.auditLogsService.createTaskLog({
        actorUserId,
        actionType: AuditActionType.TASK_UPDATED,
        targetEntityId: updatedTask.id,
        summary: `Task "${updatedTask.title}" details updated`,
      });
    }

    if (existingTask.assignedUserId !== updatedTask.assignedUserId) {
      await this.auditLogsService.createTaskLog({
        actorUserId,
        actionType: AuditActionType.TASK_ASSIGNED,
        targetEntityId: updatedTask.id,
        summary: `Task "${updatedTask.title}" assignment changed`,
      });
    }

    if (existingTask.status !== updatedTask.status) {
      await this.auditLogsService.createTaskLog({
        actorUserId,
        actionType: AuditActionType.TASK_STATUS_CHANGED,
        targetEntityId: updatedTask.id,
        summary: `Task "${updatedTask.title}" status changed from "${existingTask.status}" to "${updatedTask.status}"`,
      });
    }
  }
}
