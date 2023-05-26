import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { useContainer } from 'class-validator';
import { HttpAdapterHost, NestApplication, Reflector } from '@nestjs/core';
import { PrismaClientExceptionFilter } from '../src/prisma/filters/prisma-client-exception/prisma-client-exception.filter';
import { CreatePostDto } from '../src/posts/dto/create-post.dto';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { Post, User } from '@prisma/client';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: NestApplication;

  let user: User;
  let post: Post;

  const postShape = expect.objectContaining({
    id: expect.any(String),
    caption: expect.any(String),
    authorId: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

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

    // Create a user
    const userDto: CreateUserDto = {
      email: `user@example.com`,
      password: 'password',
      firstName: 'John',
      lastName: 'Doe',
    };
    user = await prisma.user.create({
      data: userDto,
    });

    // Create some posts for the user
    const postDtos: CreatePostDto[] = [
      { caption: 'Post 1', authorId: user.id },
      { caption: 'Post 2', authorId: user.id },
      { caption: 'Post 3', authorId: user.id },
    ];
    post = await prisma.post.create({
      data: { caption: 'Post 0', authorId: user.id },
    });
    await prisma.post.createMany({
      data: [...postDtos],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
    // Close the server instance after all tests
    httpServer.close();
  });

  it('/ (GET)', () => {
    return request(httpServer).get('/').expect(200).expect('Hello World!');
  });

  describe('/posts (GET)', () => {
    it('returns a list of posts', async () => {
      const { status, body } = await request(httpServer).get('/posts');

      expect(status).toBe(200);
      expect(body).toStrictEqual(expect.arrayContaining([postShape]));
      expect(body.length).toBe(4);
      expect(body[0]).toBeDefined();
    });

    // TODO: test with filters and pagination
  });

  describe('/posts/:id (GET)', () => {
    it('returns a post', async () => {
      const { status, body } = await request(httpServer).get(
        `/posts/${post.id}`,
      );

      expect(status).toBe(200);
      expect(body).toStrictEqual(postShape);
    });
  });
});
