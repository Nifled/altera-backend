import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';
import { OAuthLoginDto } from './dto/oauth-login.dto';

const ONE_USER: Partial<User> = {
  firstName: 'Denzel',
  lastName: 'Curry',
  email: 'denzel@ult.com',
  providerToken: 'randomToken',
  providerId: '1',
};

const PASSWORD = 'trustno1';

const DB = {
  user: {
    findUnique: jest
      .fn()
      .mockResolvedValue({ ...ONE_USER, password: PASSWORD, id: '1' }),

    update: jest.fn().mockResolvedValue(ONE_USER),
  },

  userIdentityProvider: {
    upsert: jest.fn().mockResolvedValue({ id: '1', name: 'google' }),
  },
};

const PASSWORD_SERVICE = {
  hashPassword: jest.fn().mockResolvedValue(PASSWORD),
  validatePassword: jest.fn().mockResolvedValue(true),
};

const JWT_SERVICE = {
  sign: jest.fn().mockResolvedValue('abc123'),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let passwordService: PasswordService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: JWT_SERVICE },
        { provide: PasswordService, useValue: PASSWORD_SERVICE },
        { provide: PrismaService, useValue: DB },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    passwordService = module.get<PasswordService>(PasswordService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login()', () => {
    const loginDto = {
      email: ONE_USER.email,
      password: 'trustno1',
    } as LoginDto;

    it('should successfully log in a user', async () => {
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

  describe('loginWithGoogle()', () => {
    const oAuthLoginDto = {
      email: ONE_USER.email,
      providerName: 'google',
      providerToken: 'randomToken',
      firstName: ONE_USER.firstName,
      lastName: ONE_USER.lastName,
    } as OAuthLoginDto;

    it('should successfully log in a google user', async () => {
      const findSpy = jest.spyOn(prisma.user, 'findUnique');
      const loggedInUser = await service.loginWithGoogle(oAuthLoginDto);

      expect(findSpy).toBeCalledWith({ where: { email: oAuthLoginDto.email } });
      expect(loggedInUser.accessToken).toBeDefined();
    });
  });

  describe('logout()', () => {
    it('should successfully log user out', async () => {
      const updateSpy = jest.spyOn(prisma.user, 'update');
      const response = await service.logout('1');

      expect(updateSpy).toBeCalledTimes(1);
      expect(response).toBeUndefined();
    });
  });

  describe('updateRefreshTokenForUser()', () => {
    it('should update refresh token for user', async () => {
      const updateSpy = jest.spyOn(prisma.user, 'update');
      await service.updateRefreshTokenForUser('1', null);

      expect(updateSpy).toBeCalledTimes(1);
    });
  });

  describe('generateAccessToken()', () => {
    it('should generate and return access token', async () => {
      const jwtSpy = jest.spyOn(jwtService, 'sign');
      const token = await service.generateAccessToken('1');

      expect(jwtSpy).toBeCalledTimes(1);
      expect(token).toBe('abc123');
    });
  });

  describe('generateRefreshToken()', () => {
    it('should generate and return refresh token', async () => {
      const jwtSpy = jest.spyOn(jwtService, 'sign');
      const token = await service.generateRefreshToken('1');

      expect(jwtSpy).toBeCalledTimes(1);
      expect(token).toBe('abc123');
    });
  });

  describe('getIdentityProviderByName()', () => {
    it('should generate and return refresh token', async () => {
      const upsertSpy = jest.spyOn(prisma.userIdentityProvider, 'upsert');
      const provider = await service.getIdentityProviderByName('google');

      expect(upsertSpy).toBeCalledTimes(1);
      expect(provider.name).toBe('google');
    });
  });
});
