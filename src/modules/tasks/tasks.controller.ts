import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { RolesGuard } from '../../common/auth/guards/roles.guard';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { sendResponse } from '../../common/http/send-response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // === create task ===
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    const result = await this.tasksService.create(user!.id, createTaskDto);

    return sendResponse({
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Create Task Successfully.',
      data: result,
    });
  }

  // === get all tasks ===
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    const result = await this.tasksService.findAll();

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Get All Tasks Successfully.',
      data: result,
    });
  }

  // === get my tasks ===
  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me')
  async findMyTasks(@CurrentUser() user: AuthenticatedUser | undefined) {
    const result = await this.tasksService.findAssignedTasks(user!.id);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Get My Tasks Successfully.',
      data: result,
    });
  }

  // === get my task by id ===
  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me/:id')
  async findMyTaskById(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') id: string,
  ) {
    const result = await this.tasksService.findAssignedTaskById(user!.id, id);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Get My Task Successfully.',
      data: result,
    });
  }

  // === update my task status ===
  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/status')
  async updateMyTaskStatus(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    const result = await this.tasksService.updateAssignedTaskStatus(
      user!.id,
      id,
      updateTaskStatusDto,
    );

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Update Task Status Successfully.',
      data: result,
    });
  }

  // === get task by id ===
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.tasksService.findOne(id);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Get Task Successfully.',
      data: result,
    });
  }

  // === update task ===
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const result = await this.tasksService.update(user!.id, id, updateTaskDto);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Update Task Successfully.',
      data: result,
    });
  }

  // === delete task ===
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') id: string,
  ) {
    const result = await this.tasksService.remove(user!.id, id);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Delete Task Successfully.',
      data: result,
    });
  }
}
