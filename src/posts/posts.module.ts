import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
  imports: [PrismaModule, UsersModule, StorageModule],
})
export class PostsModule {}
