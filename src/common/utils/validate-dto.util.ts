import { BadRequestException } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

/**
 *
 * Validate an object payload against a DTO
 *
 * @param dto The DTO object to validate (E.G. `PostOrderByDto`)
 * @param obj The plain object to be validated
 *
 * @example
 * ```ts
 *  await validateDto(PostDto, request.body.post);
 *
 * ```
 */
export const validateDto = async <T extends ClassConstructor<any>>(
  dto: T,
  obj: object,
): Promise<T> => {
  // Tranform the plain object to a class object
  const objInstance = plainToInstance<T, object>(dto, obj, {
    excludeExtraneousValues: true,
    exposeUnsetFields: false,
  });

  const validationErrors = await validate(objInstance);

  if (validationErrors.length > 0) {
    throw new BadRequestException(
      validationErrors.map(
        ({ property, constraints }) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          `${property}: ${Object.values(constraints!)[0]}`,
      ),
    );
  }

  return objInstance;
};
