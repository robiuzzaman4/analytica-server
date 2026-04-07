import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../common/auth/decorators/roles.decorator';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: {
    findAll: jest.Mock;
  };

  beforeEach(() => {
    usersService = {
      findAll: jest.fn(),
    };

    usersController = new UsersController(
      usersService as unknown as UsersService,
    );
  });

  it('marks user listing as admin-only', () => {
    expect(Reflect.getMetadata(ROLES_KEY, UsersController)).toEqual([
      Role.ADMIN,
    ]);
  });

  it('returns all users', async () => {
    usersService.findAll.mockResolvedValue([{ id: 'user_1' }]);

    await expect(usersController.findAll()).resolves.toEqual({
      statusCode: 200,
      success: true,
      message: 'Get All Users Successfully.',
      data: [{ id: 'user_1' }],
    });

    expect(usersService.findAll).toHaveBeenCalled();
  });
});
