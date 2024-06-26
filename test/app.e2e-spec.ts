import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { NestApplication } from '@nestjs/core';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let httpServer: NestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Reference the server instance
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    // Close the server instance after all tests
    httpServer.close();
  });

  it('/ (GET)', () => {
    return request(httpServer).get('/').expect(200).expect('Hello World!');
  });
});
