import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { RolesGuard } from '../../common/auth/guards/roles.guard';
import { sendResponse } from '../../common/http/send-response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersQueryDto } from './dto/users-query.dto';
import { UsersService } from './users.service';

// === get all users ===
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // === get all users ===
  @Get()
  async findAll(@Query() query: UsersQueryDto) {
    const result = await this.usersService.findAll(query);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Get All Users Successfully.',
      data: result,
    });
  }
}
