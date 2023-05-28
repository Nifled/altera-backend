import { BadRequestException } from '@nestjs/common';
import { PayloadExistsPipe } from './payload-exists.pipe';

describe('PayloadExistsPipe', () => {
  const pipe = new PayloadExistsPipe();

  it('should be defined', () => {
    expect(new PayloadExistsPipe()).toBeDefined();
  });

  it('should throw an exception if payload is empty', () => {
    const emptyPayload = {};

    expect(() => pipe.transform(emptyPayload)).toThrowError(
      BadRequestException,
    );
  });
});
