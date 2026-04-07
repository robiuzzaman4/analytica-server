import {
  Body,
  Controller,
  Delete,
  Get,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(user!.id, createTaskDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me')
  findMyTasks(@CurrentUser() user: AuthenticatedUser | undefined) {
    return this.tasksService.findAssignedTasks(user!.id);
  }

  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me/:id')
  findMyTaskById(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') id: string,
  ) {
    return this.tasksService.findAssignedTaskById(user!.id, id);
  }

  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/status')
  updateMyTaskStatus(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateAssignedTaskStatus(
      user!.id,
      id,
      updateTaskStatusDto,
    );
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user!.id, id, updateTaskDto);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') id: string,
  ) {
    return this.tasksService.remove(user!.id, id);
  }
}
