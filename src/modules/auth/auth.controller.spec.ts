import { Role } from '@prisma/client';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: { login: jest.Mock };
  let response: { cookie: jest.Mock };

  beforeEach(() => {
    authService = {
      login: jest.fn(),
    };
    response = {
      cookie: jest.fn(),
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
        response as unknown as Response,
      ),
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

    expect(authController.me(user)).toEqual(user);
  });
});
