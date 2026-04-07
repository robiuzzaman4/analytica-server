import { Controller, Get, HttpStatus } from '@nestjs/common';
import { sendResponse } from './common/http/send-response';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Health check retrieved successfully',
      data: {
        status: 'ok',
      },
    });
  }
}
