import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: {
    user: {
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaService = {
      user: {
        findMany: jest.fn(),
      },
    };

    usersService = new UsersService(prismaService as unknown as PrismaService);
  });

  it('returns all users when no role filter is provided', async () => {
    prismaService.user.findMany.mockResolvedValue([{ id: 'user_1' }]);

    await expect(usersService.findAll()).resolves.toEqual([{ id: 'user_1' }]);

    expect(prismaService.user.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('filters users by USER role when requested', async () => {
    prismaService.user.findMany.mockResolvedValue([{ id: 'user_2' }]);

    await expect(usersService.findAll({ role: Role.USER })).resolves.toEqual([
      { id: 'user_2' },
    ]);

    expect(prismaService.user.findMany).toHaveBeenCalledWith({
      where: {
        role: Role.USER,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('filters users by ADMIN role when requested', async () => {
    prismaService.user.findMany.mockResolvedValue([{ id: 'user_3' }]);

    await expect(usersService.findAll({ role: Role.ADMIN })).resolves.toEqual([
      { id: 'user_3' },
    ]);

    expect(prismaService.user.findMany).toHaveBeenCalledWith({
      where: {
        role: Role.ADMIN,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
});
