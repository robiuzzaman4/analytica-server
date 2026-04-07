import { Role } from '@prisma/client';
import {
  ensureDemoUsersSeeded,
  getDemoUserSeedConfig,
} from './demo-users.seed';

describe('demo-users.seed', () => {
  it('reads demo user config from validated environment values', () => {
    expect(
      getDemoUserSeedConfig({
        DATABASE_URL: 'postgresql://example',
        JWT_SECRET: 'secret',
        DEMO_ADMIN_NAME: 'Admin User',
        DEMO_ADMIN_EMAIL: 'admin@analytica.local',
        DEMO_ADMIN_PASSWORD: 'Admin123!',
        DEMO_USER_NAME: 'Normal User',
        DEMO_USER_EMAIL: 'user@analytica.local',
        DEMO_USER_PASSWORD: 'User123!',
      }),
    ).toEqual({
      admin: {
        name: 'Admin User',
        email: 'admin@analytica.local',
        password: 'Admin123!',
      },
      user: {
        name: 'Normal User',
        email: 'user@analytica.local',
        password: 'User123!',
      },
    });
  });

  it('creates only missing demo users', async () => {
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'admin_1',
            email: 'admin@analytica.local',
            name: 'Admin User',
            role: Role.ADMIN,
          })
          .mockResolvedValueOnce(null),
        create: jest.fn().mockResolvedValue({
          id: 'user_1',
          email: 'user@analytica.local',
          name: 'Normal User',
          role: Role.USER,
        }),
      },
    };

    const result = await ensureDemoUsersSeeded(prisma, {
      admin: {
        name: 'Admin User',
        email: 'admin@analytica.local',
        password: 'Admin123!',
      },
      user: {
        name: 'Normal User',
        email: 'user@analytica.local',
        password: 'User123!',
      },
    });

    expect(result.admin.email).toBe('admin@analytica.local');
    expect(result.user.email).toBe('user@analytica.local');
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    const [createCall] = prisma.user.create.mock.calls as [
      [
        {
          data: {
            name: string;
            email: string;
            password: string;
            role: Role;
          };
        },
      ],
    ];

    expect(createCall[0].data).toEqual(
      expect.objectContaining({
        name: 'Normal User',
        email: 'user@analytica.local',
        role: Role.USER,
      }),
    );
  });
});
