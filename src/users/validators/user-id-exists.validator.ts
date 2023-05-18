import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { UsersService } from '../users.service';

// Custom Decorator (uses `UserIdExistsValidator`)
export function IsValidUserId(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: UserIdExistsValidator,
    });
  };
}

@ValidatorConstraint({ async: true })
@Injectable()
export class UserIdExistsValidator implements ValidatorConstraintInterface {
  constructor(private readonly userService: UsersService) {}

  async validate(userId: string) {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new NotFoundException(`User not found with id: ${userId}.`);
    }

    return true;
  }

  defaultMessage() {
    return 'Invalid User ID.';
  }
}
