import { User } from '@prisma/client';
import { UserIdExistsPipe } from './user-id-exists.pipe';
import { PrismaService } from '../../prisma/prisma.service';
import { Test } from '@nestjs/testing';

const USERS_ARRAY: Partial<User>[] = [
  { firstName: 'Denzel', lastName: 'Curry', email: 'denzel@ult.com' },
  { firstName: 'Donald', lastName: 'Glover', email: 'childish@gambino.com' },
];
const ONE_USER = USERS_ARRAY[0];

const DB = {
  user: {
    findUnique: jest.fn().mockResolvedValue(ONE_USER),
  },
};

describe('UserIdExistsPipe', () => {
  let pipe: UserIdExistsPipe;
  let service: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserIdExistsPipe,
        {
          provide: PrismaService,
          useValue: DB,
        },
      ],
    }).compile();

    pipe = moduleRef.get<UserIdExistsPipe>(UserIdExistsPipe);
    service = moduleRef.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return true if validation passes', async () => {
    const findUniqueSpy = jest.spyOn(service.user, 'findUnique');

    const result = await pipe.validate('123');

    expect(findUniqueSpy).toBeCalledWith({ where: { id: '123' } });
    expect(result).toBe(true);
  });

  it('should throw an exception if validation fails', async () => {
    const findUniqueSpy = jest
      .spyOn(service.user, 'findUnique')
      .mockResolvedValueOnce(null);

    expect(findUniqueSpy).toBeCalledWith({ where: { id: '123' } });
    await expect(pipe.validate('456')).rejects.toThrowError();
  });
});
