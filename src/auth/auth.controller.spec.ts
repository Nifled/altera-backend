import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';
import { OAuthLoginDto } from './dto/oauth-login.dto';

const SERVICE = {
  login: jest
    .fn()
    .mockResolvedValue({ accessToken: 'abc123', refreshToken: 'abc123' }),
  loginWithGoogle: jest
    .fn()
    .mockResolvedValue({ accessToken: 'abc123', refreshToken: 'abc123' }),
  logout: jest.fn(),
  refresh: jest
    .fn()
    .mockResolvedValue({ accessToken: 'xyz123', refreshToken: 'xyz123' }),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: SERVICE }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/login login()', () => {
    const payload = { email: 'test@test.com', password: 'trustno1' };

    it('should return accessToken accessToken + refreshToken', async () => {
      const loginSpy = jest.spyOn(service, 'login');
      const loginResponse = await controller.login(payload);

      expect(loginSpy).toBeCalledWith(payload.email, payload.password);
      expect(loginResponse).toEqual({
        accessToken: 'abc123',
        refreshToken: 'abc123',
      });
    });
  });

  describe('GET /auth/logout logout()', () => {
    it('should logout user', async () => {
      const logoutSpy = jest.spyOn(service, 'logout');

      await controller.logout({} as User);

      expect(logoutSpy).toBeCalledTimes(1);
    });
  });

  describe('GET /auth/refresh refresh()', () => {
    it('should refresh refreshToken', async () => {
      const refreshSpy = jest.spyOn(service, 'refresh');

      const tokens = await controller.refresh({} as User);

      expect(refreshSpy).toBeCalledTimes(1);
      expect(tokens).toEqual({ accessToken: 'xyz123', refreshToken: 'xyz123' });
    });
  });

  describe('GET /auth/google/callback loginWithGoogle()', () => {
    it('should log in google user and return tokens', async () => {
      const googleSpy = jest.spyOn(service, 'loginWithGoogle');

      const tokens = await controller.googleAuthCallback({} as OAuthLoginDto);

      expect(googleSpy).toBeCalledTimes(1);
      expect(tokens).toEqual({ accessToken: 'abc123', refreshToken: 'abc123' });
    });
  });
});
