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
import { CreatePostDto } from '../src/posts/dto/create-post.dto';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { Post, User } from '@prisma/client';
import { ConfigModule } from '@nestjs/config';
import config from '../src/config/index.config';

describe('PostsController (e2e)', () => {
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
      imports: [AppModule, ConfigModule.forRoot({ load: [config] })],
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
      email: `userForPosts@example.com`,
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

  describe('/posts (GET)', () => {
    it('returns a list of posts', async () => {
      const {
        status,
        body: { data },
      } = await request(httpServer).get('/posts');

      expect(status).toBe(200);
      expect(data).toStrictEqual(expect.arrayContaining([postShape]));
      expect(data.length).toBe(4);
      expect(data[0].id).toBe(post.id);
      expect(new Date(data[0].createdAt)).toEqual(post.createdAt);
    });

    it('returns a paginated list of posts with cursor', async () => {
      const {
        status,
        body: { data, meta },
      } = await request(httpServer).get('/posts').query({ limit: '3' });

      expect(status).toBe(200);
      expect(data.length).toBe(3);
      expect(meta.next_cursor).toBe(data[data.length - 1].id);
    });

    it('returns a list of posts ordered by caption (asc)', async () => {
      const expectedPosts = await prisma.post.findMany({
        orderBy: { caption: 'asc' },
        take: 3,
      });

      const {
        status,
        body: { data },
      } = await request(httpServer).get('/posts').query({
        limit: '3',
        orderBy: 'caption',
      });

      expect(status).toBe(200);
      expect(data[0].caption).toStrictEqual(expectedPosts[0].caption);
      expect(data[1].caption).toStrictEqual(expectedPosts[1].caption);
      expect(data[2].caption).toStrictEqual(expectedPosts[2].caption);
    });

    it('returns a list of posts ordered by caption (desc)', async () => {
      const expectedPosts = await prisma.post.findMany({
        orderBy: { caption: 'desc' },
        take: 3,
      });

      const {
        status,
        body: { data },
      } = await request(httpServer).get('/posts').query({
        limit: '3',
        orderBy: '-caption',
      });

      expect(status).toBe(200);
      expect(data[0].caption).toStrictEqual(expectedPosts[0].caption);
      expect(data[1].caption).toStrictEqual(expectedPosts[1].caption);
      expect(data[2].caption).toStrictEqual(expectedPosts[2].caption);
    });
  });

  describe('/posts/:id (GET)', () => {
    it('returns a post', async () => {
      const { status, body } = await request(httpServer).get(
        `/posts/${post.id}`,
      );

      expect(status).toBe(200);
      expect(body).toStrictEqual(postShape);
    });

    it('fails to return post with invalid id input', async () => {
      const badId = 'someRandomId123';

      const { status, body } = await request(httpServer).get(`/posts/${badId}`);

      expect(status).toBe(404);
      expect(body.message).toBe(`Post not found with id: ${badId}.`);
    });
  });

  describe('/posts (POST)', () => {
    it('should create a post', async () => {
      const { status, body } = await request(httpServer)
        .post('/posts')
        .send({ caption: 'Post 4', authorId: user.id });

      expect(status).toBe(201);
      expect(body.authorId).toBe(user.id);
    });

    it('fails to create a post without authorId input', async () => {
      const { status } = await request(httpServer)
        .post('/posts')
        .send({ caption: 'Post 5' });

      expect(status).toBe(400);
    });
  });

  describe('/posts/:id (PATCH)', () => {
    it('should update a post', async () => {
      const { status, body } = await request(httpServer)
        .patch(`/posts/${post.id}`)
        .send({ caption: 'Post bajillion' });

      expect(status).toBe(200);
      expect(body.caption).toBe('Post bajillion');
    });

    it('should fail to update a post with bad req data', async () => {
      const { status } = await request(httpServer)
        .patch(`/posts/${post.id}`)
        .send({ id: 'newCoolId' });

      expect(status).toBe(400);
    });

    it('should fail to update a post with bad id input', async () => {
      const { status } = await request(httpServer)
        .patch(`/posts/someRandomId`)
        .send({ caption: 'Post bazillion' });

      expect(status).toBe(404);
    });
  });

  describe('/posts/:id (DELETE)', () => {
    it('should delete a post', async () => {
      const { status, body } = await request(httpServer).delete(
        `/posts/${post.id}`,
      );

      expect(status).toBe(200);
      expect(body.id).toBe(post.id);
    });

    it('should fail to delete a post with wrong id', async () => {
      const { status } = await request(httpServer).delete(
        `/posts/someRandomId`,
      );

      expect(status).toBe(404);
    });
  });
});
