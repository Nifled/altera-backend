import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PayloadExistsPipe implements PipeTransform {
  transform(payload: any) {
    if (!payload) {
      throw new BadRequestException('Payload is not valid.');
    }

    if (!Object.keys(payload).length) {
      throw new BadRequestException('Payload should not be empty.');
    }

    return payload;
  }
}
