import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

const PASSWORD = 'trustno1';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService, ConfigService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('validatePassword() should return true if passwords match', async () => {
    const compareSpy = jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation(() => true);

    const result = await service.validatePassword('password', 'hashedPassword');
    expect(result).toBe(true);
    expect(compareSpy).toHaveBeenCalledTimes(1);
  });

  it('hashPassword() should return the hashed password', async () => {
    const hashSpy = jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(() => PASSWORD);

    const result = await service.hashPassword('password');
    expect(result).toBe(PASSWORD);
    expect(hashSpy).toBeCalledTimes(1);
  });
});
