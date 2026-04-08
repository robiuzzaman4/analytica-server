import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    jwtStrategy = new JwtStrategy(
      {
        getOrThrow: jest.fn().mockReturnValue('test-secret'),
      } as unknown as ConfigService,
      prismaService as unknown as PrismaService,
    );
  });

  it('returns the current user from the database', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'admin_1',
      name: 'Admin User',
      email: 'admin@analytica.local',
      role: Role.ADMIN,
    });

    await expect(
      jwtStrategy.validate({
        sub: 'admin_1',
        name: 'Old Name',
        email: 'old@analytica.local',
        role: Role.ADMIN,
      }),
    ).resolves.toEqual({
      id: 'admin_1',
      name: 'Admin User',
      email: 'admin@analytica.local',
      role: Role.ADMIN,
    });
  });

  it('rejects tokens for users that no longer exist', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      jwtStrategy.validate({
        sub: 'missing_user',
        name: 'Admin User',
        email: 'admin@analytica.local',
        role: Role.ADMIN,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
