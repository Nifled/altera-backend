import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { useContainer } from 'class-validator';
import { HttpAdapterHost, NestApplication, Reflector } from '@nestjs/core';
import { PrismaClientExceptionFilter } from '../src/prisma/filters/prisma-client-exception/prisma-client-exception.filter';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { User } from '@prisma/client';
import { UsersService } from '../src/users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('PostsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let httpServer: NestApplication;

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
      { secret: process.env.JWT_ACCESS_TOKEN_SECRET },
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
});
