import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserIdExists } from './validators/user-id-exists.validator';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserIdExists],
  imports: [PrismaModule],
  exports: [UsersService],
})
export class UsersModule {}
