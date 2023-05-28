import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserIdExistsPipe } from './pipes/user-id-exists.pipe';
import { PasswordService } from '../auth/password.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserIdExistsPipe, PasswordService],
  imports: [PrismaModule],
  exports: [UsersService],
})
export class UsersModule {}
