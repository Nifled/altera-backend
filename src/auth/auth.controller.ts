import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthEntity } from './entities/auth.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { AuthenticatedUser } from './decorators/authenticated-user.decorator';
import { User } from '@prisma/client';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { OAuthLoginDto } from './dto/oauth-login.dto';

@Controller({ path: 'auth', version: '1' })
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ type: AuthEntity })
  login(@Body() { email, password }: LoginDto) {
    return this.authService.login(email, password);
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  logout(@AuthenticatedUser() user: User) {
    const { id } = user;

    return this.authService.logout(id);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard, JwtRefreshGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AuthEntity })
  refresh(@AuthenticatedUser() user: User) {
    const { id } = user;

    return this.authService.refresh(id);
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleOAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(@AuthenticatedUser() googleUser: OAuthLoginDto) {
    return await this.authService.loginWithGoogle(googleUser);
  }
}
