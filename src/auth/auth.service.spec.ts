import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';

const ONE_USER: Partial<User> = {
  firstName: 'Denzel',
  lastName: 'Curry',
  email: 'denzel@ult.com',
};

const PASSWORD = 'trustno1';

const DB = {
  user: {
    findUnique: jest
      .fn()
      .mockResolvedValue({ ...ONE_USER, password: PASSWORD, id: '1' }),

    update: jest.fn().mockResolvedValue(ONE_USER),
  },
};

const PASSWORD_SERVICE = {
  hashPassword: jest.fn().mockResolvedValue(PASSWORD),
  validatePassword: jest.fn().mockResolvedValue(true),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: PasswordService, useValue: PASSWORD_SERVICE },
        { provide: PrismaService, useValue: DB },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login()', () => {
    const loginDto = {
      email: ONE_USER.email,
      password: 'trustno1',
    } as LoginDto;

    it('should successfully create a user', async () => {
      const loginSpy = jest.spyOn(prisma.user, 'findUnique');
      const passwordSpy = jest.spyOn(passwordService, 'validatePassword');
      const loggedInUser = await service.login(
        loginDto.email,
        loginDto.password,
      );

      expect(loginSpy).toBeCalledWith({ where: { email: ONE_USER.email } });
      expect(passwordSpy).toBeCalledWith(PASSWORD, loginDto.password);
      expect(loggedInUser.accessToken).toBeDefined();
    });
  });
});
