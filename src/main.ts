import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const APP_PORT = 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });

  const packageJson = readFileSync('./package.json', 'utf-8');
  const { version }: { version: string } = JSON.parse(packageJson);

  Logger.verbose('APP VERSION', version);

  // Set up Swagger
  const config = new DocumentBuilder()
    .setTitle('Altera')
    .setDescription('The Altera API Suite')
    .setVersion(version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(APP_PORT);
  Logger.verbose(`App is now running on port=${APP_PORT}`);
}
bootstrap();
