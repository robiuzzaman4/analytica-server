import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: { login: jest.Mock; logout: jest.Mock };
  let response: { cookie: jest.Mock; clearCookie: jest.Mock };

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      logout: jest.fn().mockReturnValue(null),
    };
    response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
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
      authController.login(
        {
          email: 'admin@analytica.local',
          password: 'Admin123!',
        },
        response as never,
      ),
    ).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Login Successfully.',
      data: {
        accessToken: 'signed-jwt-token',
        user: {
          id: 'user_1',
          name: 'Admin User',
          email: 'admin@analytica.local',
          role: Role.ADMIN,
        },
      },
    });

    expect(authService.login).toHaveBeenCalledWith(
      'admin@analytica.local',
      'Admin123!',
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'accessToken',
      'signed-jwt-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      }),
    );
  });

  it('returns the authenticated user for the me endpoint', () => {
    const user = {
      id: 'user_1',
      name: 'Admin User',
      email: 'admin@analytica.local',
      role: Role.ADMIN,
    };

    expect(authController.me(user)).toEqual({
      statusCode: 200,
      success: true,
      message: 'Get Profile Successfully.',
      data: user,
    });
  });

  it('clears the auth cookie and delegates logout to the auth service', () => {
    expect(authController.logout(response as never)).toEqual({
      statusCode: 200,
      success: true,
      message: 'Logout Successfully.',
      data: null,
    });

    expect(response.clearCookie).toHaveBeenCalledWith(
      'accessToken',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      }),
    );
    expect(authService.logout).toHaveBeenCalled();
  });
});
