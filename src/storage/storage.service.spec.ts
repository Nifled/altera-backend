import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from '../config/index.config';

const mockS3Instance = {
  send: jest.fn().mockReturnValue({ $metadata: { httpStatusCode: 200 } }),
  promise: jest.fn(),
};

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn(() => mockS3Instance),
    PutObjectCommand: jest.fn(),
  };
});

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [config] })],
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile()', () => {
    const testFile: Partial<Express.Multer.File> = {
      mimetype: 'image/jpeg',
      buffer: Buffer.from('This is a test file'),
    };

    it('should successfully upload a file and return image url', async () => {
      const clientSpy = jest.spyOn(mockS3Instance, 'send');
      const imageUrl = await service.uploadFile(
        testFile as Express.Multer.File,
        'test',
      );

      expect(clientSpy).toBeCalledTimes(1);
      expect(imageUrl).toStartWith('https://');
      expect(imageUrl).toEndWith('test');
    });
  });
});
