import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { RolesGuard } from '../../common/auth/guards/roles.guard';
import { sendResponse } from '../../common/http/send-response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    const result = await this.usersService.findAll();

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Get All Users Successfully.',
      data: result,
    });
  }
}
