import { NotFoundException } from '@nestjs/common';
import { Role, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let tasksService: TasksService;
  let prismaService: {
    task: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaService = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    tasksService = new TasksService(prismaService as unknown as PrismaService);
  });

  it('creates a task with a default status', async () => {
    prismaService.task.create.mockResolvedValue({ id: 'task_1' });

    await expect(
      tasksService.create({
        title: 'Prepare release notes',
        description: 'Summarize changes',
      }),
    ).resolves.toEqual({ id: 'task_1' });

    const [createCall] = prismaService.task.create.mock.calls as [
      [
        {
          data: {
            title: string;
            description: string;
            status: TaskStatus;
            assignedUserId: string | null;
          };
        },
      ],
    ];

    expect(createCall[0].data).toEqual({
      title: 'Prepare release notes',
      description: 'Summarize changes',
      status: TaskStatus.PENDING,
      assignedUserId: null,
    });
  });

  it('rejects creation when the assigned user does not exist', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      tasksService.create({
        title: 'Prepare release notes',
        description: 'Summarize changes',
        assignedUserId: 'missing_user',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists tasks newest first', async () => {
    prismaService.task.findMany.mockResolvedValue([{ id: 'task_1' }]);

    await expect(tasksService.findAll()).resolves.toEqual([{ id: 'task_1' }]);

    expect(prismaService.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('returns a task by id', async () => {
    prismaService.task.findUnique.mockResolvedValue({ id: 'task_1' });

    await expect(tasksService.findOne('task_1')).resolves.toEqual({
      id: 'task_1',
    });
  });

  it('throws when a task is not found', async () => {
    prismaService.task.findUnique.mockResolvedValue(null);

    await expect(tasksService.findOne('missing_task')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists only tasks assigned to the requested user', async () => {
    prismaService.task.findMany.mockResolvedValue([{ id: 'task_1' }]);

    await expect(tasksService.findAssignedTasks('user_1')).resolves.toEqual([
      { id: 'task_1' },
    ]);

    expect(prismaService.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assignedUserId: 'user_1' },
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('returns an assigned task only when the user owns it', async () => {
    prismaService.task.findFirst.mockResolvedValue({ id: 'task_1' });

    await expect(
      tasksService.findAssignedTaskById('user_1', 'task_1'),
    ).resolves.toEqual({ id: 'task_1' });

    expect(prismaService.task.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'task_1',
          assignedUserId: 'user_1',
        },
      }),
    );
  });

  it('rejects fetching an assigned task when the user does not own it', async () => {
    prismaService.task.findFirst.mockResolvedValue(null);

    await expect(
      tasksService.findAssignedTaskById('user_1', 'task_2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a task after ensuring it exists', async () => {
    prismaService.task.findUnique.mockResolvedValue({
      id: 'task_1',
      title: 'Prepare release notes',
      description: 'Summarize changes',
      status: TaskStatus.PENDING,
      assignedUserId: 'user_1',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedUser: {
        id: 'user_1',
        name: 'Demo User',
        email: 'user@analytica.local',
        role: Role.USER,
      },
    });
    prismaService.user.findUnique.mockResolvedValue({ id: 'user_2' });
    prismaService.task.update.mockResolvedValue({ id: 'task_1' });

    await expect(
      tasksService.update('task_1', {
        status: TaskStatus.DONE,
        assignedUserId: 'user_2',
      }),
    ).resolves.toEqual({ id: 'task_1' });

    const [updateCall] = prismaService.task.update.mock.calls as [
      [
        {
          where: { id: string };
          data: {
            title?: string;
            description?: string;
            status?: TaskStatus;
            assignedUserId?: string | null;
          };
        },
      ],
    ];

    expect(updateCall[0].where).toEqual({ id: 'task_1' });
    expect(updateCall[0].data).toEqual({
      title: undefined,
      description: undefined,
      status: TaskStatus.DONE,
      assignedUserId: 'user_2',
    });
  });

  it('rejects updates when the assigned user does not exist', async () => {
    prismaService.task.findUnique.mockResolvedValue({
      id: 'task_1',
      title: 'Prepare release notes',
      description: 'Summarize changes',
      status: TaskStatus.PENDING,
      assignedUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedUser: null,
    });
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      tasksService.update('task_1', {
        assignedUserId: 'missing_user',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a task after ensuring it exists', async () => {
    prismaService.task.findUnique.mockResolvedValue({
      id: 'task_1',
      title: 'Prepare release notes',
      description: 'Summarize changes',
      status: TaskStatus.PENDING,
      assignedUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedUser: null,
    });
    prismaService.task.delete.mockResolvedValue({ id: 'task_1' });

    await expect(tasksService.remove('task_1')).resolves.toEqual({
      id: 'task_1',
    });

    expect(prismaService.task.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task_1' },
      }),
    );
  });
});
