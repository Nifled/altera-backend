import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { PasswordService } from './password.service';

const JWTAuthModule = JwtModule.register({
  secret: process.env.JWT_ACCESS_TOKEN_SECRET,
  signOptions: {
    expiresIn: '5m',
  },
});

@Module({
  imports: [PrismaModule, PassportModule, JWTAuthModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, PasswordService],
})
export class AuthModule {}
