import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const SERVICE = {
  login: jest.fn().mockResolvedValue({ accessToken: 'abc123' }),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, { provide: AuthService, useValue: SERVICE }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/login login()', () => {
    const payload = { email: 'test@test.com', password: 'trustno1' };

    it('should return accessToken', async () => {
      const createdSpy = jest.spyOn(service, 'login');
      const createdUser = await controller.login(payload);

      expect(createdSpy).toBeCalledWith(payload.email, payload.password);
      expect(createdUser).toEqual({ accessToken: 'abc123' });
    });
  });
});
