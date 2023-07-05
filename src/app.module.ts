import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { HttpLoggerMiddleware } from './common/logger/http-logger.middleware';
import { StorageModule } from './storage/storage.module';
import config from './config/index.config';

@Module({
  imports: [
    // Load env vars
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        ttl: config.get<number>('rateLimit.duration'),
        limit: config.get<number>('rateLimit.max'),
      }),
    }),
    PrismaModule,
    AuthModule,
    PostsModule,
    UsersModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // Apply rate limiting globally to every endpoint
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
