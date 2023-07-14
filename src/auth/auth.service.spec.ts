import { Test, TestingModule } from '@nestjs/testing';
import { JsonWebTokenError } from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';
import { OAuthLoginDto } from './dto/oauth-login.dto';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
  verify: jest.fn().mockReturnValue('abc123'),
  decode: jest.fn().mockReturnValue({ userId: '1' }),
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
        ConfigService,
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

  describe('forgotPassword()', () => {
    it('should successfully create a reset token', async () => {
      const findSpy = jest.spyOn(prisma.user, 'findUnique');
      const jwtSpy = jest.spyOn(jwtService, 'sign');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await service.forgotPassword(ONE_USER.email!);

      expect(findSpy).toBeCalledWith({ where: { email: ONE_USER.email } });
      expect(jwtSpy).toBeCalledWith({ userId: '1' }, { expiresIn: '30m' });
    });
  });

  describe('resetPassword()', () => {
    const resetPasswordDto = {
      token: 'randomToken',
      newPassword: 'trustno1',
    } as ResetPasswordDto;

    it('should successfully reset user password', async () => {
      const findSpy = jest.spyOn(prisma.user, 'findUnique');
      const updateSpy = jest.spyOn(prisma.user, 'update');
      const jwtVerifySpy = jest.spyOn(jwtService, 'verify');
      const jwtDecodeSpy = jest.spyOn(jwtService, 'decode');
      const passwordSpy = jest.spyOn(passwordService, 'hashPassword');
      await service.resetPassword(resetPasswordDto);

      expect(jwtVerifySpy).toBeCalledWith(resetPasswordDto.token);
      expect(jwtDecodeSpy).toBeCalledWith(resetPasswordDto.token);
      expect(findSpy).toBeCalledWith({ where: { id: '1' } });
      expect(passwordSpy).toBeCalledWith(resetPasswordDto.newPassword);
      expect(updateSpy).toBeCalledWith({
        where: { id: '1' },
        data: { password: resetPasswordDto.newPassword },
      });
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

  describe('isJwtExpired()', () => {
    it('should return false if jwt is NOT expired', async () => {
      const jwtSpy = jest.spyOn(jwtService, 'verify');
      const isTokenExpired = await service.isJwtExpired('abc123');

      expect(jwtSpy).toBeCalledTimes(1);
      expect(isTokenExpired).toBe(false);
    });

    it('should return true if jwt is expired', async () => {
      const jwtSpy = jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new JsonWebTokenError('Expired');
      });

      const isTokenExpired = await service.isJwtExpired('expiredToken123');

      expect(jwtSpy).toBeCalledTimes(1);
      expect(isTokenExpired).toBe(true);
    });
  });
});
