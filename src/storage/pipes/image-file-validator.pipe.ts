import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ValidationOptions, registerDecorator } from 'class-validator';

// Custom Decorator (uses `ImageFileValidatorPipe`)
/**
 *
 * @returns Checks if the file is an image and is less than 5MB.
 */
export function IsValidImageFile(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ImageFileValidatorPipe,
    });
  };
}

@Injectable()
export class ImageFileValidatorPipe implements PipeTransform {
  transform(payload: any) {
    if (!this.isFileValid(payload)) {
      throw new BadRequestException('Invalid file');
    }

    return payload;
  }

  isFileValid(payload: any) {
    const file = payload as Express.Multer.File;

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
      throw new BadRequestException('File size exceeds the 5MB limit.');
    }

    return true;
  }
}
