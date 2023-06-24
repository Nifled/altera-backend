import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserEntity implements User {
  // Controllers return User type from Prisma Client (includes password)
  // Use this Entity structure instead to exclude the password from responses.
  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true, type: String })
  firstName: string | null;

  @ApiProperty({ nullable: true, type: String })
  lastName: string | null;

  @ApiProperty()
  email: string;

  @Exclude()
  password: string | null;

  @Exclude()
  providerId: string | null;

  @Exclude()
  providerToken: string | null;

  @Exclude()
  refreshToken: string | null;
}
