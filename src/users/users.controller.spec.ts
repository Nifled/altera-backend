import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USERS_ARRAY: Partial<User>[] = [
  { firstName: 'Denzel', lastName: 'Curry', email: 'denzel@ult.com' },
  { firstName: 'Donald', lastName: 'Glover', email: 'childish@gambino.com' },
];
const ONE_USER = USERS_ARRAY[0];

const SERVICE = {
  findAll: jest.fn().mockResolvedValue(USERS_ARRAY),
  findOne: jest.fn().mockResolvedValue(ONE_USER),
  create: jest.fn().mockResolvedValue(ONE_USER),
  update: jest.fn().mockResolvedValue(ONE_USER),
  remove: jest.fn().mockResolvedValue(ONE_USER),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService, { provide: UsersService, useValue: SERVICE }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /users create()', () => {
    const createUserDto = new CreateUserDto();

    it('should successfully create a post', async () => {
      const createdSpy = jest.spyOn(service, 'create');
      const createdUser = await controller.create(createUserDto);

      expect(createdSpy).toBeCalledTimes(1);
      expect(createdUser).toEqual(ONE_USER);
    });
  });

  describe('GET /users findAll()', () => {
    it('should return an array of users', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll');
      const users = await controller.findAll();

      expect(findAllSpy).toBeCalledTimes(1);
      expect(users).toEqual(USERS_ARRAY);
    });
  });

  describe('GET /users findOne()', () => {
    it('should return a user', async () => {
      const findOneSpy = jest.spyOn(service, 'findOne');
      const post = await controller.findOne('1');

      expect(findOneSpy).toBeCalledWith('1');
      expect(post).toEqual(ONE_USER);
    });
  });

  describe('PATCH /users update()', () => {
    const udpatePostDto = new UpdateUserDto();

    it('should return the updated user', async () => {
      const updateSpy = jest.spyOn(service, 'update');
      const user = await controller.update('1', udpatePostDto);

      expect(updateSpy).toBeCalledWith('1', udpatePostDto);
      expect(user).toEqual(ONE_USER);
    });
  });

  describe('DELETE /users remove()', () => {
    it('should return the removed user', async () => {
      const removeSpy = jest.spyOn(service, 'remove');
      const deletedUser = await controller.remove('1');

      expect(removeSpy).toBeCalledWith('1');
      expect(deletedUser).toEqual(ONE_USER);
    });
  });
});
