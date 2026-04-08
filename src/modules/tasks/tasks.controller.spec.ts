import { Role, TaskStatus } from '@prisma/client';
import { ROLES_KEY } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { TasksQueryDto } from './dto/tasks-query.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let tasksController: TasksController;
  let tasksService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findAssignedTasks: jest.Mock;
    findAssignedTaskById: jest.Mock;
    updateAssignedTaskStatus: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    tasksService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAssignedTasks: jest.fn(),
      findAssignedTaskById: jest.fn(),
      updateAssignedTaskStatus: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    tasksController = new TasksController(
      tasksService as unknown as TasksService,
    );
  });

  it('marks task creation as admin-only', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      TasksController.prototype,
      'create',
    );

    expect(Reflect.getMetadata(ROLES_KEY, descriptor?.value as object)).toEqual(
      [Role.ADMIN],
    );
  });

  it('delegates creation to the service', async () => {
    const createTaskDto: CreateTaskDto = {
      title: 'Prepare release notes',
      description: 'Summarize changes for the sprint release',
      status: TaskStatus.PENDING,
      assignedUserId: 'user_1',
    };
    const user: AuthenticatedUser = {
      id: 'admin_1',
      name: 'Admin User',
      email: 'admin@analytica.local',
      role: Role.ADMIN,
    };

    tasksService.create.mockResolvedValue({ id: 'task_1', ...createTaskDto });

    await expect(tasksController.create(user, createTaskDto)).resolves.toEqual({
      statusCode: 201,
      success: true,
      message: 'Create Task Successfully.',
      data: { id: 'task_1', ...createTaskDto },
    });

    expect(tasksService.create).toHaveBeenCalledWith('admin_1', createTaskDto);
  });

  it('delegates listing to the service', async () => {
    const query: TasksQueryDto = {
      page: 2,
      limit: 10,
    };

    tasksService.findAll.mockResolvedValue({
      items: [{ id: 'task_1' }],
      pagination: {
        page: 2,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      },
    });

    await expect(tasksController.findAll(query)).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Get All Tasks Successfully.',
      data: {
        items: [{ id: 'task_1' }],
        pagination: {
          page: 2,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      },
    });
    expect(tasksService.findAll).toHaveBeenCalledWith(query);
  });

  it('marks current-user task listing as user-only', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      TasksController.prototype,
      'findMyTasks',
    );

    expect(Reflect.getMetadata(ROLES_KEY, descriptor?.value as object)).toEqual(
      [Role.USER],
    );
  });

  it('returns tasks assigned to the authenticated user', async () => {
    const user: AuthenticatedUser = {
      id: 'user_1',
      name: 'Normal User',
      email: 'user@analytica.local',
      role: Role.USER,
    };
    const query: TasksQueryDto = {
      page: 3,
      limit: 5,
    };

    tasksService.findAssignedTasks.mockResolvedValue({
      items: [{ id: 'task_1' }],
      pagination: {
        page: 3,
        limit: 5,
        totalItems: 1,
        totalPages: 1,
      },
    });

    await expect(tasksController.findMyTasks(user, query)).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Get My Tasks Successfully.',
      data: {
        items: [{ id: 'task_1' }],
        pagination: {
          page: 3,
          limit: 5,
          totalItems: 1,
          totalPages: 1,
        },
      },
    });

    expect(tasksService.findAssignedTasks).toHaveBeenCalledWith(
      'user_1',
      query,
    );
  });

  it('returns a single assigned task for the authenticated user', async () => {
    const user: AuthenticatedUser = {
      id: 'user_1',
      name: 'Normal User',
      email: 'user@analytica.local',
      role: Role.USER,
    };

    tasksService.findAssignedTaskById.mockResolvedValue({ id: 'task_1' });

    await expect(
      tasksController.findMyTaskById(user, 'task_1'),
    ).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Get My Task Successfully.',
      data: { id: 'task_1' },
    });

    expect(tasksService.findAssignedTaskById).toHaveBeenCalledWith(
      'user_1',
      'task_1',
    );
  });

  it('marks current-user task status updates as user-only', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      TasksController.prototype,
      'updateMyTaskStatus',
    );

    expect(Reflect.getMetadata(ROLES_KEY, descriptor?.value as object)).toEqual(
      [Role.USER],
    );
  });

  it('updates only the status of an authenticated user task', async () => {
    const user: AuthenticatedUser = {
      id: 'user_1',
      name: 'Normal User',
      email: 'user@analytica.local',
      role: Role.USER,
    };
    const updateTaskStatusDto: UpdateTaskStatusDto = {
      status: TaskStatus.PROCESSING,
    };

    tasksService.updateAssignedTaskStatus.mockResolvedValue({
      id: 'task_1',
      ...updateTaskStatusDto,
    });

    await expect(
      tasksController.updateMyTaskStatus(user, 'task_1', updateTaskStatusDto),
    ).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Update Task Status Successfully.',
      data: {
        id: 'task_1',
        ...updateTaskStatusDto,
      },
    });

    expect(tasksService.updateAssignedTaskStatus).toHaveBeenCalledWith(
      'user_1',
      'task_1',
      updateTaskStatusDto,
    );
  });

  it('delegates fetching a single task to the service', async () => {
    tasksService.findOne.mockResolvedValue({ id: 'task_1' });

    await expect(tasksController.findOne('task_1')).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Get Task Successfully.',
      data: { id: 'task_1' },
    });

    expect(tasksService.findOne).toHaveBeenCalledWith('task_1');
  });

  it('delegates updates to the service', async () => {
    const updateTaskDto: UpdateTaskDto = {
      status: TaskStatus.DONE,
    };
    const user: AuthenticatedUser = {
      id: 'admin_1',
      name: 'Admin User',
      email: 'admin@analytica.local',
      role: Role.ADMIN,
    };

    tasksService.update.mockResolvedValue({
      id: 'task_1',
      ...updateTaskDto,
    });

    await expect(
      tasksController.update(user, 'task_1', updateTaskDto),
    ).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Update Task Successfully.',
      data: {
        id: 'task_1',
        ...updateTaskDto,
      },
    });

    expect(tasksService.update).toHaveBeenCalledWith(
      'admin_1',
      'task_1',
      updateTaskDto,
    );
  });

  it('delegates deletion to the service', async () => {
    const user: AuthenticatedUser = {
      id: 'admin_1',
      name: 'Admin User',
      email: 'admin@analytica.local',
      role: Role.ADMIN,
    };

    tasksService.remove.mockResolvedValue({ id: 'task_1' });

    await expect(tasksController.remove(user, 'task_1')).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Delete Task Successfully.',
      data: { id: 'task_1' },
    });

    expect(tasksService.remove).toHaveBeenCalledWith('admin_1', 'task_1');
  });
});
