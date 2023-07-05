import { Injectable } from '@nestjs/common';
import { BadRequestException, Logger } from '@nestjs/common';
import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

interface StorageProvider {
  uploadFile: (file: Express.Multer.File, key: string) => Promise<string>;
}

@Injectable()
export class StorageService implements StorageProvider {
  private client: S3Client;
  private region: string;
  private bucket: string;
  private logger = new Logger(StorageService.name);

  constructor(private config: ConfigService) {
    this.createProviderInstance();
  }

  /**
   * Upload a file to storage provider
   * @param file The file to upload
   * @param key The key of the file
   * @returns The url of the uploaded file
   */
  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const input: PutObjectCommandInput = {
      Bucket: this.bucket,
      Body: file.buffer,
      Key: key,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    try {
      const response = await this.client.send(new PutObjectCommand(input));

      if (response?.$metadata?.httpStatusCode === 200) {
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
      }

      // If there is other status code other than 200, the image was not uploaded
      throw new BadRequestException('Failed to upload image.');
    } catch (error) {
      this.logger.error("Couldn't upload image to storage provider.", error);
      throw error;
    }
  }

  private createProviderInstance() {
    const bucket = this.config.get<string>('s3.bucket');
    const region = this.config.get<string>('s3.region');
    const accessKeyId = this.config.get<string>('s3.accessKeyId');
    const secretAccessKey = this.config.get<string>('s3.secretAccessKey');

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new BadRequestException(
        'Bad config/credentials for storage provider.',
      );
    }

    this.bucket = bucket;
    this.region = region;

    this.client = new S3Client({
      region: this.region,
      credentials: { accessKeyId, secretAccessKey },
    });

    return this.client;
  }
}
