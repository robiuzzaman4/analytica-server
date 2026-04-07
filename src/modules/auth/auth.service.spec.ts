import { hash } from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from './auth.service';

async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: { user: { findUnique: jest.Mock } };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
    };

    authService = new AuthService(
      prismaService as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  it('returns a JWT and user details for valid credentials', async () => {
    const user = {
      id: 'user_1',
      name: 'Admin User',
      email: 'admin@analytica.local',
      password: await hashPassword('Admin123!'),
      role: Role.ADMIN,
    };

    prismaService.user.findUnique.mockResolvedValue(user);

    await expect(
      authService.login('admin@analytica.local', 'Admin123!'),
    ).resolves.toEqual({
      accessToken: 'signed-jwt-token',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  });

  it('rejects unknown users', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login('missing@analytica.local', 'Admin123!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects invalid passwords', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user_1',
      name: 'Admin User',
      email: 'admin@analytica.local',
      password: await hashPassword('Admin123!'),
      role: Role.ADMIN,
    });

    await expect(
      authService.login('admin@analytica.local', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
