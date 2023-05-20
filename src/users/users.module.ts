import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserIdExistsValidator } from './validators/user-id-exists.validator';
import { PasswordService } from '../auth/password.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserIdExistsValidator, PasswordService],
  imports: [PrismaModule],
  exports: [UsersService],
})
export class UsersModule {}
