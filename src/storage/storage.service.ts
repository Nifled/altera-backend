import { Injectable } from '@nestjs/common';
import { BadRequestException, Logger } from '@nestjs/common';
import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

interface StorageProvider {
  uploadFiles: (files: Express.Multer.File[], key: string) => Promise<string[]>;
}

@Injectable()
export class StorageService implements StorageProvider {
  private client: S3Client;
  private region: string;
  private bucket: string;
  private logger = new Logger(StorageService.name);

  constructor(config: ConfigService) {
    this.createS3ProviderInstance(config);
  }

  /**
   * Upload file/s to storage provider
   * @param files Array of files to upload
   * @param keyPrefix String to use as a prefix for the s3 upload key for files
   * @returns An array containing the urls of the uploaded files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    keyPrefix?: string,
  ): Promise<string[]> {
    // To upload multiple files, create an array of Promises for each
    // request and `Promise.all` that bitch
    const uploadPromises: Promise<string>[] = files.map((file) => {
      return new Promise(async (resolve, reject) => {
        const key = `${keyPrefix || ''}${
          file.originalname
        }${Date.now()}_${Math.round(Math.random() * 1000)}`;

        const fileInput: PutObjectCommandInput = {
          Bucket: this.bucket,
          Body: file.buffer,
          Key: key,
          ContentType: file.mimetype,
          ACL: 'public-read',
        };

        try {
          const response = await this.client.send(
            new PutObjectCommand(fileInput),
          );

          if (response?.$metadata?.httpStatusCode !== 200) {
            // If there is other status code other than 200, the file was not uploaded
            reject(new BadRequestException('Failed to upload file.'));
          }

          // Return the url of the uploaded file
          resolve(
            `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
          );
        } catch (error) {
          reject(error);
        }
      });
    });

    try {
      const fileUrls = await Promise.all(uploadPromises);

      return fileUrls;
    } catch (error) {
      this.logger.error("Couldn't upload files to storage provider.", error);
      throw error;
    }
  }

  private createS3ProviderInstance(config: ConfigService) {
    const bucket = config.get<string>('s3.bucket');
    const region = config.get<string>('s3.region');
    const accessKeyId = config.get<string>('s3.accessKeyId');
    const secretAccessKey = config.get<string>('s3.secretAccessKey');

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
