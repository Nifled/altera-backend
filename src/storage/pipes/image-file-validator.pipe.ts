import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ValidationOptions, registerDecorator } from 'class-validator';

// Custom Decorator (uses `ImageFileValidatorPipe`)
/**
 *
 * @returns Checks if the file is an image and is less than 5MB.
 */
export function IsValidImageFileArray(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ImageFilesValidatorPipe,
    });
  };
}

/**
 * @returns Throws a `BadRequestException` error if any file within the payload is not valid. Note: Only checks actual files, if there aren't any files in the payload, it'll pass
 */
@Injectable()
export class ImageFilesValidatorPipe implements PipeTransform {
  transform(payload: any) {
    const files = payload as Express.Multer.File[];

    if (files) {
      // Check every file, exit early if something is not valid
      files.forEach((file) => {
        if (!this.isFileValidImage(file)) {
          throw new BadRequestException('Invalid files');
        }
      });
    }

    return payload;
  }

  isFileValidImage(file: Express.Multer.File) {
    const validFileTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/jpg',
      'image/webp',
    ];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (!file) {
      return false;
    }

    if (!validFileTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. File must be an image.',
      );
    }

    if (file.size > maxFileSize) {
      throw new BadRequestException("File's size exceeds the 5MB limit.");
    }

    return true;
  }
}
