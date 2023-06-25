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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      user.password!,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password.');
    }

    return this.generateTokensForUser(user.id);
  }

  // TODO: TEST ALL THIS SHIT NEW BRO

  async loginWithGoogle(oAuthLoginDto: OAuthLoginDto): Promise<AuthEntity> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: oAuthLoginDto.email },
    });

    // Check if its an actual provider (google) user by checking providerToken
    if (existingUser?.providerToken !== oAuthLoginDto.providerToken) {
      throw new BadRequestException(
        'There is already a user registered with this email.',
      );
    }

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
