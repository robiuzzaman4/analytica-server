import { scryptSync, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user || !this.isPasswordValid(password, user.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  private isPasswordValid(password: string, storedPassword: string): boolean {
    const [salt, expectedHash] = storedPassword.split(':');

    if (!salt || !expectedHash) {
      return false;
    }

    const derivedHash = scryptSync(password, salt, 64).toString('hex');

    return timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(derivedHash, 'hex'),
    );
  }
}
