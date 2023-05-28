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

describe('PostsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: NestApplication;

  let user: User;

  const authLoginShape = expect.objectContaining({
    accessToken: expect.any(String),
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
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
});
