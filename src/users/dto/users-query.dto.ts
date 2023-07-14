import { User } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

/**
 * This class represents the query params for `/users` endpoints.
 * For example: GET `/users?email=${email}&firstName=${firstName}&lastName=${lastName}`
 */
export class UsersQueryDto implements Partial<User> {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
