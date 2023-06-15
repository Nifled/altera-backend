import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });
  }

  // onModuleInit is optional — if left out, Prisma will
  // connect lazily on its first call to the database.
  async onModuleInit() {
    this.$on<any>('query', (event: Prisma.QueryEvent) => {
      this.logger.debug(`Query: ${event.query}`);
      this.logger.debug(`Query Duration: ${event.duration} ms`);
    });

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
