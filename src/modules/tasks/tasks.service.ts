import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
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

@Injectable()
export class TasksService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    await this.ensureAssignedUserExists(createTaskDto.assignedUserId);

    return this.prismaService.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status ?? TaskStatus.PENDING,
        assignedUserId: createTaskDto.assignedUserId ?? null,
      },
      select: taskSelect,
    });
  }

  findAll() {
    return this.prismaService.task.findMany({
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

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    await this.findOne(id);
    await this.ensureAssignedUserExists(updateTaskDto.assignedUserId);

    return this.prismaService.task.update({
      where: { id },
      data: {
        title: updateTaskDto.title,
        description: updateTaskDto.description,
        status: updateTaskDto.status,
        assignedUserId: updateTaskDto.assignedUserId,
      },
      select: taskSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prismaService.task.delete({
      where: { id },
      select: taskSelect,
    });
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
}
