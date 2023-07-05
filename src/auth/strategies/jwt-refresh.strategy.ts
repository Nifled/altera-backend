import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(
    private config: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          if (!request?.body?.refreshToken) {
            throw new BadRequestException();
          }

          return request.body.refreshToken;
        },
      ]),
      secretOrKey: config.get<string>('jwt.refresh.secret'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: { userId: string }) {
    const rawRefreshToken: string = request.body.refreshToken;

    const user = await this.usersService.findOne(payload.userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    const isValidRefreshToken = rawRefreshToken === user.refreshToken;
    if (!isValidRefreshToken) {
      throw new UnauthorizedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}
