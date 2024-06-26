import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { PasswordService } from './password.service';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { ConfigService } from '@nestjs/config';

const JWTAuthModule = JwtModule.registerAsync({
  useFactory: (config: ConfigService) => ({
    secret: config.get<string>('jwt.access.secret'),
    signOptions: {
      expiresIn: config.get<string>('jwt.access.expiresIn'),
    },
  }),
  inject: [ConfigService],
});

@Module({
  imports: [PrismaModule, PassportModule, JWTAuthModule, UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    PasswordService,
  ],
})
export class AuthModule {}
