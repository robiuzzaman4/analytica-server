import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../common/auth/decorators/roles.decorator';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: { login: jest.Mock };

  beforeEach(() => {
    authService = {
      login: jest.fn(),
    };

    authController = new AuthController(authService as unknown as AuthService);
  });

  it('delegates login to the auth service', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'signed-jwt-token',
      user: {
        id: 'user_1',
        name: 'Admin User',
        email: 'admin@analytica.local',
        role: Role.ADMIN,
      },
    });

    await expect(
      authController.login({
        email: 'admin@analytica.local',
        password: 'Admin123!',
      }),
    ).resolves.toEqual({
      accessToken: 'signed-jwt-token',
      user: {
        id: 'user_1',
        name: 'Admin User',
        email: 'admin@analytica.local',
        role: Role.ADMIN,
      },
    });

    expect(authService.login).toHaveBeenCalledWith(
      'admin@analytica.local',
      'Admin123!',
    );
  });

  it('returns the authenticated user for the me endpoint', () => {
    const user = {
      id: 'user_1',
      email: 'admin@analytica.local',
      role: Role.ADMIN,
    };

    expect(authController.me(user)).toEqual(user);
  });

  it('returns the authenticated admin user for the admin me endpoint', () => {
    const user = {
      id: 'user_1',
      email: 'admin@analytica.local',
      role: Role.ADMIN,
    };

    expect(authController.adminMe(user)).toEqual(user);
  });

  it('marks the admin me endpoint as admin-only', () => {
    const adminMeDescriptor = Object.getOwnPropertyDescriptor(
      AuthController.prototype,
      'adminMe',
    );

    expect(
      Reflect.getMetadata(ROLES_KEY, adminMeDescriptor?.value as object),
    ).toEqual([Role.ADMIN]);
  });
});
