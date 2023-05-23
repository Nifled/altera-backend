import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';

// Custom Decorator (uses `UserIdExistsValidator`)
/**
 *
 * @returns Checks if the userId exists in the database
 */
export function IsValidUserId(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: UserIdExistsPipe,
    });
  };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class UserIdExistsPipe implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException(`User not found with id: ${userId}.`);
      }
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e;
      }

      throw new BadRequestException(this.defaultMessage());
    }

    return true;
  }

  defaultMessage() {
    return 'Invalid User ID.';
  }
}
