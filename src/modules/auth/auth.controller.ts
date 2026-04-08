/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/auth/interfaces/authenticated-user.interface';
import { sendResponse } from '../../common/http/send-response';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // === login ===
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response,
  ) {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    // === set auth cookie for browser clients ===
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Login Successfully.',
      data: result,
    });
  }

  // === get profile ===
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser | undefined) {
    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Get Profile Successfully.',
      data: user ?? null,
    });
  }

  // === logout ===
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) response) {
    // === clear auth cookie for browser clients ===
    response.clearCookie('accessToken', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    const result = this.authService.logout();

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Logout Successfully.',
      data: result,
    });
  }
}
