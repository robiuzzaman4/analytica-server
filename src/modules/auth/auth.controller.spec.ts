import { Role } from '@prisma/client';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: { login: jest.Mock; logout: jest.Mock };
  let response: { cookie: jest.Mock; clearCookie: jest.Mock };

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      logout: jest.fn().mockReturnValue({
        message: 'Logged out successfully',
      }),
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

  it('clears the auth cookie and delegates logout to the auth service', () => {
    expect(authController.logout(response as unknown as Response)).toEqual({
      message: 'Logged out successfully',
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
