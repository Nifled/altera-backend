import { Injectable } from '@nestjs/common';
import { BadRequestException, Logger } from '@nestjs/common';
import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';

interface StorageProvider {
  uploadFile: (file: Express.Multer.File, key: string) => Promise<string>;
}

@Injectable()
export class StorageService implements StorageProvider {
  private client: S3Client;
  private region: string;
  private logger = new Logger(StorageService.name);

  constructor() {
    this.createProviderInstance();
  }

  /**
   * Upload a file to storage provider
   * @param file The file to upload
   * @param key The key of the file
   * @returns The url of the file
   */
  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const bucket = process.env.AWS_S3_BUCKET;
    const input: PutObjectCommandInput = {
      Bucket: bucket,
      Body: file.buffer,
      Key: key,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    try {
      const response = await this.client.send(new PutObjectCommand(input));

      if (response.$metadata.httpStatusCode === 200) {
        return `https://${bucket}.s3.${this.region}.amazonaws.com/${key}`;
      }

      // If there is other status code other than 200, the image was not uploaded
      throw new BadRequestException('Failed to upload image.');
    } catch (error) {
      this.logger.error("Couldn't upload image to storage provider.", error);
      throw error;
    }
  }

  private createProviderInstance() {
    this.region = process.env.AWS_S3_REGION || 'us-west-1';
    this.client = new S3Client({
      region: this.region,
      credentials: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
      },
    });

    return this.client;
  }
}
