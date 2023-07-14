import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordService } from '../auth/password.service';
import { PaginationParamsDto } from '../common/pagination/pagination-params.dto';
import { ConfigService } from '@nestjs/config';

const USERS_ARRAY: Partial<User>[] = [
  { firstName: 'Denzel', lastName: 'Curry', email: 'denzel@ult.com' },
  { firstName: 'Donald', lastName: 'Glover', email: 'childish@gambino.com' },
];
const ONE_USER = USERS_ARRAY[0];
const PASSWORD = 'trustno1';

const DB = {
  user: {
    findMany: jest.fn().mockResolvedValue(USERS_ARRAY),
    findUnique: jest.fn().mockResolvedValue(ONE_USER),
    create: jest.fn().mockResolvedValue({ ...ONE_USER, password: PASSWORD }),
    update: jest.fn().mockResolvedValue(ONE_USER),
    delete: jest.fn().mockResolvedValue(ONE_USER),
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        ConfigService,
        PasswordService,
        { provide: PrismaService, useValue: DB },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    const createUserDto = {
      ...ONE_USER,
      password: 'trustno1',
    };

    it('should successfully create a user', async () => {
      const createdUser = await service.create(createUserDto as CreateUserDto);

      expect(createdUser.firstName).toEqual(ONE_USER.firstName);
      expect(createdUser.lastName).toEqual(ONE_USER.lastName);
      expect(createdUser.email).toEqual(ONE_USER.email);
      expect(createdUser.password).toBeDefined(); // controller is in charge of filtering out properties
      expect(createdUser.password).toBe(PASSWORD);
    });
  });

  describe('findAll()', () => {
    it('should return an array of users', async () => {
      const users = await service.findAll({} as PaginationParamsDto);
      expect(users).toEqual(USERS_ARRAY);
    });
  });

  describe('findOne()', () => {
    it('should get a single user', async () => {
      const findOneSpy = jest.spyOn(prisma.user, 'findUnique');
      const foundUser = await service.findOne('1');

      expect(findOneSpy).toBeCalledWith({ where: { id: '1' } });
      expect(foundUser).toEqual(ONE_USER);
    });
  });

  describe('update()', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Erick',
    };

    it('should update a single user', async () => {
      const updateSpy = jest.spyOn(prisma.user, 'update');
      const updatedUser = await service.update('1', updateUserDto);

      expect(updateSpy).toBeCalledWith({
        where: { id: '1' },
        data: updateUserDto,
      });
      expect(updatedUser).toEqual(ONE_USER);
    });
  });

  describe('remove()', () => {
    it('should remove a single user', async () => {
      const removeSpy = jest.spyOn(prisma.user, 'delete');
      const removedUser = await service.remove('1');

      expect(removeSpy).toBeCalledWith({ where: { id: '1' } });
      expect(removedUser).toEqual(ONE_USER);
    });
  });
});
