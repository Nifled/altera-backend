import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserIdExistsValidator } from './validators/user-id-exists.validator';
import { AuthModule } from '../auth/auth.module';
import { PasswordService } from '../auth/password.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserIdExistsValidator, PasswordService],
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  exports: [UsersService],
})
export class UsersModule {}
