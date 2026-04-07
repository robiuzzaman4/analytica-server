import { Role, TaskStatus } from '@prisma/client';
import { ROLES_KEY } from '../../common/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { CreateTaskDto } from './dto/create-task.dto';
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

    tasksService.create.mockResolvedValue({ id: 'task_1', ...createTaskDto });

    await expect(tasksController.create(createTaskDto)).resolves.toEqual({
      id: 'task_1',
      ...createTaskDto,
    });

    expect(tasksService.create).toHaveBeenCalledWith(createTaskDto);
  });

  it('delegates listing to the service', async () => {
    tasksService.findAll.mockResolvedValue([{ id: 'task_1' }]);

    await expect(tasksController.findAll()).resolves.toEqual([
      { id: 'task_1' },
    ]);
    expect(tasksService.findAll).toHaveBeenCalled();
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
      email: 'user@analytica.local',
      role: Role.USER,
    };

    tasksService.findAssignedTasks.mockResolvedValue([{ id: 'task_1' }]);

    await expect(tasksController.findMyTasks(user)).resolves.toEqual([
      { id: 'task_1' },
    ]);

    expect(tasksService.findAssignedTasks).toHaveBeenCalledWith('user_1');
  });

  it('returns a single assigned task for the authenticated user', async () => {
    const user: AuthenticatedUser = {
      id: 'user_1',
      email: 'user@analytica.local',
      role: Role.USER,
    };

    tasksService.findAssignedTaskById.mockResolvedValue({ id: 'task_1' });

    await expect(
      tasksController.findMyTaskById(user, 'task_1'),
    ).resolves.toEqual({
      id: 'task_1',
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
      id: 'task_1',
      ...updateTaskStatusDto,
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
      id: 'task_1',
    });

    expect(tasksService.findOne).toHaveBeenCalledWith('task_1');
  });

  it('delegates updates to the service', async () => {
    const updateTaskDto: UpdateTaskDto = {
      status: TaskStatus.DONE,
    };

    tasksService.update.mockResolvedValue({
      id: 'task_1',
      ...updateTaskDto,
    });

    await expect(
      tasksController.update('task_1', updateTaskDto),
    ).resolves.toEqual({
      id: 'task_1',
      ...updateTaskDto,
    });

    expect(tasksService.update).toHaveBeenCalledWith('task_1', updateTaskDto);
  });

  it('delegates deletion to the service', async () => {
    tasksService.remove.mockResolvedValue({ id: 'task_1' });

    await expect(tasksController.remove('task_1')).resolves.toEqual({
      id: 'task_1',
    });

    expect(tasksService.remove).toHaveBeenCalledWith('task_1');
  });
});
