import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { RolesGuard } from '../../common/auth/guards/roles.guard';
import { sendResponse } from '../../common/http/send-response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogsService } from './audit-logs.service';

@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(@Query() query: AuditLogQueryDto) {
    const result = await this.auditLogsService.findAll(query);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Get Audit Logs Successfully.',
      data: result,
    });
  }
}
