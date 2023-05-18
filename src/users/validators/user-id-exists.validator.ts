import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UsersService } from '../users.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class UserIdExists implements ValidatorConstraintInterface {
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
