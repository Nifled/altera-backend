import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { useContainer } from 'class-validator';
import { HttpAdapterHost, NestApplication, Reflector } from '@nestjs/core';
import { PrismaClientExceptionFilter } from '../src/prisma/filters/prisma-client-exception/prisma-client-exception.filter';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { User } from '@prisma/client';
import { UsersService } from '../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('PostsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let httpServer: NestApplication;
  let config: ConfigService;

  let user: User;
  let bearerToken: string;

  const authLoginShape = expect.objectContaining({
    accessToken: expect.any(String),
    refreshToken: expect.any(String),
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    jwt = app.get<JwtService>(JwtService);
    config = app.get<ConfigService>(ConfigService);
    const usersService = app.get<UsersService>(UsersService);

    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));
    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    await app.init();

    // Reference the server instance
    httpServer = app.getHttpServer();

    // Create a user to log in
    const userDto: CreateUserDto = {
      email: `userForAuth@example.com`,
      password: 'password',
    };
    user = await usersService.create(userDto);

    // Generate a jwt to be used for protected routes
    bearerToken = jwt.sign(
      { userId: user.id },
      { secret: config.get<string>('jwt.access.secret') },
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
    // Close the server instance after all tests
    httpServer.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login a user', async () => {
      const { status, body } = await request(httpServer)
        .post('/auth/login')
        .send({ email: user.email, password: 'password' });

      expect(status).toBe(201);
      expect(body).toStrictEqual(authLoginShape);
    });

    it('should return not found if email is wrong', async () => {
      const { status } = await request(httpServer)
        .post('/auth/login')
        .send({ email: 'wrongEmail@example.com', password: 'password' });

      expect(status).toBe(404);
    });

    it('should return bad request exception if password is wrong', async () => {
      const { status } = await request(httpServer)
        .post('/auth/login')
        .send({ email: user.email, password: 'wrongPassword' });

      expect(status).toBe(400);
    });
  });

  describe('/auth/google (GET)', () => {
    it('should return a redirect to /auth/google/callback', async () => {
      const { status, body, headers } = await request(httpServer).get(
        '/auth/google',
      );

      expect(status).toBe(302);
      expect(body).toBeEmpty();
      expect(
        headers.location.includes('accounts.google.com/o/oauth2/v2/auth'),
      ).toBeTrue();
    });
  });

  describe('/auth/google/callback (GET)', () => {
    // Google tokenURL
    nock('https://www.googleapis.com')
      .post('/oauth2/v4/token')
      .query(true)
      .reply(200, {
        access_token: 'mockAccessToken',
      });

    // Google userProfileURL
    nock('https://www.googleapis.com')
      .get('/oauth2/v3/userinfo')
      .query(true)
      .reply(200, {
        id: '12345', // user google id
        given_name: 'Denzel',
        family_name: 'Curry',
        emails: [{ value: 'test@example.com' }],
      });

    it('should log in a google user given the correct data', async () => {
      const { status, body } = await request(httpServer)
        .get('/auth/google/callback')
        .query({ code: 'mockAuthCode' });

      expect(status).toBe(200);
      expect(body).toStrictEqual(authLoginShape);

      const session: any = jwt.decode(body.accessToken);
      const foundUser = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('test@example.com');
      expect(foundUser?.refreshToken).toBe(body.refreshToken);
    });
  });

  describe('/auth/logout (GET)', () => {
    it('should logout a user', async () => {
      const { status, body } = await request(httpServer)
        .get('/auth/logout')
        .set('Authorization', `Bearer ${bearerToken}`);

      expect(status).toBe(200);
      expect(body).toBeEmpty();
    });
  });

  describe('/auth/refresh (POST)', () => {
    let currentRefreshToken: string;

    beforeAll(async () => {
      const { body } = await request(httpServer)
        .post('/auth/login')
        .send({ email: user.email, password: 'password' });

      currentRefreshToken = body.refreshToken;
    });

    it('should successfully refresh a users refreshToken', async () => {
      const { status, body } = await request(httpServer)
        .post('/auth/refresh')
        .send({ refreshToken: currentRefreshToken })
        .set('Authorization', `Bearer ${bearerToken}`);

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(status).toBe(201);
      expect(body.refreshToken === updatedUser?.refreshToken).toBeTrue();
    });

    it('should return unauthorized error if refreshToken is not valid', async () => {
      const { status } = await request(httpServer)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalidRefreshToken' })
        .set('Authorization', `Bearer ${bearerToken}`);

      expect(status).toBe(401);
    });

    it('should return bad request error no refreshToken is provided', async () => {
      const { status } = await request(httpServer)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${bearerToken}`);

      expect(status).toBe(400);
    });
  });

  describe('auth/reset-password (POST)', () => {
    it('should successfully reset user password', async () => {
      const resetToken = jwt.sign({ userId: user.id }, { expiresIn: '30m' });

      const { status, body } = await request(httpServer)
        .post('/auth/reset-password')
        .send({ token: resetToken, newPassword: 'trustEvery1' });

      expect(status).toBe(201);
      expect(body).toBeEmpty();

      // Try logging back in with the new password
      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({ email: user.email, password: 'trustEvery1' });

      expect(loginResponse.status).toBe(201);
    });

    it('should return 400 if token is expired', async () => {
      const expiredToken = jwt.sign({ userId: user.id }, { expiresIn: '-1s' });

      const { status } = await request(httpServer)
        .post('/auth/reset-password')
        .send({ token: expiredToken, newPassword: 'trustEvery1' });

      expect(status).toBe(400);
    });

    it('should return 404 Not Found if user does not exist', async () => {
      const resetToken = jwt.sign(
        { userId: 'invalidUserId' }, // <-- user does not exist
        { expiresIn: '30m' },
      );

      const { status } = await request(httpServer)
        .post('/auth/reset-password')
        .send({ token: resetToken, newPassword: 'trustEvery1' });

      expect(status).toBe(404);
    });
  });
});
