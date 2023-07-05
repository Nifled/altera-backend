import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthEntity } from './entities/auth.entity';
import { PasswordService } from './password.service';
import { OAuthLoginDto } from './dto/oauth-login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      user.password!,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password.');
    }

    return this.generateTokensForUser(user.id);
  }

  async loginWithGoogle(oAuthLoginDto: OAuthLoginDto): Promise<AuthEntity> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: oAuthLoginDto.email },
    });

    if (!existingUser) {
      const provider = await this.getIdentityProviderByName(
        oAuthLoginDto.providerName,
      );

      const newUser = await this.prisma.user.create({
        data: {
          firstName: oAuthLoginDto.firstName,
          lastName: oAuthLoginDto.lastName,
          email: oAuthLoginDto.email,
          providerToken: oAuthLoginDto.providerToken,
          providerId: provider.id,
          // Note: these users have no passwords
        },
      });

      return this.generateTokensForUser(newUser.id);
    }

    // Check if existing user is an external user (google, etc)
    if (
      !existingUser.providerId ||
      existingUser.providerToken !== oAuthLoginDto.providerToken
    ) {
      throw new BadRequestException(
        'There is already a user registered with this email.',
      );
    }

    return this.generateTokensForUser(existingUser.id);
  }

  async logout(userId: string) {
    await this.updateRefreshTokenForUser(userId, null);
  }

  async refresh(userId: string): Promise<AuthEntity> {
    return this.generateTokensForUser(userId);
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

  /**
   * Generates both access/refresh tokens and returns them
   * @param userId string
   * @returns AuthEntity
   */
  private async generateTokensForUser(userId: string): Promise<AuthEntity> {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);
    await this.updateRefreshTokenForUser(userId, refreshToken);

    return new AuthEntity({ accessToken, refreshToken });
  }

  generateAccessToken(userId: string) {
    return this.jwtService.sign(
      { userId },
      {
        secret: this.config.get<string>('jwt.access.secret'),
        expiresIn: this.config.get<string>('jwt.access.expiresIn'),
      },
    );
  }

  generateRefreshToken(userId: string) {
    return this.jwtService.sign(
      { userId },
      {
        secret: this.config.get<string>('jwt.refresh.secret'),
        expiresIn: this.config.get<string>('jwt.refresh.expiresIn'),
      },
    );
  }

  async getIdentityProviderByName(providerName: string) {
    return await this.prisma.userIdentityProvider.upsert({
      where: { name: providerName },
      create: { name: providerName },
      // If the update property is empty, the record will not be updated.
      // thus, this functions as a findOrCreate-like operation
      update: {},
    });
  }
}
