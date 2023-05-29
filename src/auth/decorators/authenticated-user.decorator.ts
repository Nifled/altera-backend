import { ExecutionContext, createParamDecorator } from '@nestjs/common';

// JWT Passport will d attach `user` as a property on the
// Request object when using `@UseGuards(JwtAuthGuard)`.
/**
 * Get the authenticated user from the request.
 */
export const AuthenticatedUser = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
