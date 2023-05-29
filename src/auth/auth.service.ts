import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthEntity } from './entities/auth.entity';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private passwordService: PasswordService,
  ) {}

  async login(email: string, password: string): Promise<AuthEntity> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException(`User not found with email: ${email}.`);
    }

    const isPasswordValid = await this.passwordService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password.');
    }

    const refreshToken = this.generateRefreshToken(user.id);
    this.updateRefreshTokenForUser(user.id, refreshToken);

    return {
      accessToken: this.generateAccessToken(user.id),
      refreshToken,
    };
  }

  async logout(userId: string) {
    await this.updateRefreshTokenForUser(userId, null);
  }

  async refresh(userId: string): Promise<AuthEntity> {
    const newRefreshToken = this.generateRefreshToken(userId);

    await this.updateRefreshTokenForUser(userId, newRefreshToken);

    return {
      accessToken: this.generateAccessToken(userId),
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Updates the refreshToken for the given user in the database
   */
  async updateRefreshTokenForUser(userId: string, refreshToken: string | null) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  generateAccessToken(userId: string) {
    return this.jwtService.sign(
      { userId },
      { secret: process.env.JWT_ACCESS_TOKEN_SECRET },
    );
  }

  generateRefreshToken(userId: string) {
    return this.jwtService.sign(
      { userId },
      {
        secret: process.env.JWT_REFRESH_TOKEN_SECRET,
        expiresIn: '7d', // 1 week expiry for refresh tokens
      },
    );
  }
}
