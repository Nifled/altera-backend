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

  const userShape = expect.objectContaining({
    id: expect.any(String),
    firstName: expect.toBeOneOf([expect.any(String), null]),
    lastName: expect.toBeOneOf([expect.any(String), null]),
    email: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    jwt = app.get<JwtService>(JwtService);
    config = app.get<ConfigService>(ConfigService);

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
      email: `userForUsers@example.com`,
      password: 'password',
      firstName: 'John',
      lastName: 'Doe',
    };
    user = await prisma.user.create({
      data: userDto,
    });

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

  describe('/users (POST)', () => {
    it('should create a user', async () => {
      const { status, body } = await request(httpServer)
        .post('/users')
        .send({ email: 'user123@example.com', password: 'password' });

      expect(status).toBe(201);
      expect(body).toStrictEqual(userShape);
      expect(body.email).toBe('user123@example.com');
      expect(body.password).toBeUndefined();
      expect(body.firstName).toBeNull();
    });

    it('fails to create a user with bad input', async () => {
      const { status } = await request(httpServer)
        .post('/users')
        .send({ username: 'user123', password: 'password' });

      expect(status).toBe(400);
    });
  });

  describe('/users (GET)', () => {
    it('returns a list of users', async () => {
      const {
        status,
        body: { data },
      } = await request(httpServer)
        .get('/users')
        .set('Authorization', `Bearer ${bearerToken}`);

      expect(status).toBe(200);
      expect(data).toStrictEqual(expect.arrayContaining([userShape]));
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data.some((x: any) => x.id === user.id)).toBeTruthy();
    });

    it('fails if a bearer token is not provided', async () => {
      const { status } = await request(httpServer).get('/users');

      expect(status).toBe(401);
    });

    it('returns a filtered result given a firstName query param', async () => {
      const {
        status,
        body: { data },
      } = await request(httpServer)
        .get('/users')
        .set('Authorization', `Bearer ${bearerToken}`)
        .query({ email: 'userForUsers' });

      expect(status).toBe(200);
      expect(data[0].email).toBe(user.email);
      expect(data[0].email).toContain('userForUsers');
    });
  });

  describe('/users/:id (GET)', () => {
    it('returns a user', async () => {
      const { status, body } = await request(httpServer)
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${bearerToken}`);

      expect(status).toBe(200);
      expect(body).toStrictEqual(userShape);
    });

    it('fails to return user with invalid id input', async () => {
      const badId = 'someRandomId123';

      const { status, body } = await request(httpServer)
        .get(`/users/${badId}`)
        .set('Authorization', `Bearer ${bearerToken}`);

      expect(status).toBe(404);
      expect(body.message).toBe(`User not found with id: ${badId}.`);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update a user', async () => {
      const { status, body } = await request(httpServer)
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ firstName: 'Denzel', lastName: 'Curry' });

      expect(status).toBe(200);
      expect(body.firstName).toBe('Denzel');
    });

    it('should fail to update a user with bad req data', async () => {
      const { status } = await request(httpServer)
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ id: 'newCoolId' });

      expect(status).toBe(400);
    });

    it('should fail to update a user with bad id input', async () => {
      const { status } = await request(httpServer)
        .patch(`/users/someRandomId`)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ firstName: 'Denzel', lastName: 'Curry' });

      expect(status).toBe(404);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should delete a user', async () => {
      const tempUser = await prisma.user.create({
        data: {
          email: `tempUser${Math.random()}@example.com`,
          password: 'password',
          firstName: 'Xyz',
          lastName: 'Xyz',
        },
      });
      const tempUserToken = jwt.sign(
        { userId: tempUser.id },
        { secret: config.get<string>('jwt.access.secret') },
      );

      const { status, body } = await request(httpServer)
        .delete(`/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${tempUserToken}`);

      expect(status).toBe(200);
      expect(body.id).toBe(tempUser.id);
    });

    it('should fail to delete a user with wrong id', async () => {
      const { status } = await request(httpServer)
        .delete(`/users/someRandomId`)
        .set('Authorization', `Bearer ${bearerToken}`);

      expect(status).toBe(404);
    });
  });
});
