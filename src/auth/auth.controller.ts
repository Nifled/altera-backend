import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthEntity } from './entities/auth.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { AuthenticatedUser } from './decorators/authenticated-user.decorator';
import { User } from '@prisma/client';

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
}
