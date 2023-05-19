import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './strategy/jwt.strategy';

const JWTAuthModule = JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: '5m',
  },
});

@Module({
  imports: [PrismaModule, PassportModule, JWTAuthModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
