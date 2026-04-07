import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let rolesGuard: RolesGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    rolesGuard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const context = createContext(Role.USER);

    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('allows access when the authenticated user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    const context = createContext(Role.ADMIN);

    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('rejects access when the authenticated user lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    const context = createContext(Role.USER);

    expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
  });
});

function createContext(role?: Role): ExecutionContext {
  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: role
          ? {
              id: 'user_1',
              email: 'user@analytica.local',
              role,
            }
          : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}
