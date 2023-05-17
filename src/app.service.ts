import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(`Environment variables are missing.`);
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
