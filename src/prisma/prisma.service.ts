import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
    (this as any).$on('query', (event: Prisma.QueryEvent) => {
      this.logger.debug(`Query: ${event.query}`);
      this.logger.debug(`Query Duration: ${event.duration} ms`);
    });

    await this.$connect();
  }
}
