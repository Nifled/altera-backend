import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientExceptionFilter } from './prisma-client-exception.filter';
import { HttpStatus } from '@nestjs/common';

const mockJson = jest.fn();
const mockStatus = jest.fn().mockImplementation(() => ({
  json: mockJson,
}));
const mockGetResponse = jest.fn().mockImplementation(() => ({
  status: mockStatus,
}));
const mockHttpArgumentsHost = jest.fn().mockImplementation(() => ({
  getResponse: mockGetResponse,
  getRequest: jest.fn(),
}));
const mockArgumentsHost = {
  switchToHttp: mockHttpArgumentsHost,
  getArgByIndex: jest.fn(),
  getArgs: jest.fn(),
  getType: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
};

describe('PrismaClientExceptionFilter', () => {
  let filter: PrismaClientExceptionFilter;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaClientExceptionFilter],
    }).compile();

    filter = module.get<PrismaClientExceptionFilter>(
      PrismaClientExceptionFilter,
    );
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch and handle PrismaClientKnownRequestError', () => {
    const mockPrismaException = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint violation',
      { code: 'P2002', clientVersion: '1' },
    );

    filter.catch(mockPrismaException, mockArgumentsHost);

    expect(mockHttpArgumentsHost).toBeCalledTimes(1);
    expect(mockHttpArgumentsHost).toBeCalledWith();
    expect(mockGetResponse).toBeCalledTimes(1);
    expect(mockGetResponse).toBeCalled();
    expect(mockStatus).toBeCalledTimes(1);
    expect(mockStatus).toBeCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toBeCalledTimes(1);
    expect(mockJson).toBeCalledWith({
      message: '[P2002]: Unique constraint violation',
      statusCode: 409,
    });
  });
});
