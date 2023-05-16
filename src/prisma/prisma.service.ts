import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // onModuleInit is optional — if left out, Prisma will
  // connect lazily on its first call to the database.
  async onModuleInit() {
    await this.$connect();
  }

  // Prisma interferes with NestJS `enableShutdownHooks`. Prisma
  // listens for shutdown signals and will call `process.exit()`
  // before your application shutdown hooks fire. To deal with
  // this, add a listener for Prisma 'beforeExit' event.
  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
