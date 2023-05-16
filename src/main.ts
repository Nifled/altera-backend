import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

const APP_PORT = 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });

  app.useGlobalPipes(new ValidationPipe());

  const packageJson = readFileSync('./package.json', 'utf-8');
  const { version }: { version: string } = JSON.parse(packageJson);

  // Set up Swagger
  loadSwagger();

  await app.listen(APP_PORT);
  Logger.verbose(`App is now running on port=${APP_PORT}`);
  Logger.verbose('APP VERSION', version);

  function loadSwagger() {
    const config = new DocumentBuilder()
      .setTitle('Altera')
      .setDescription('The Altera API Suite')
      .setVersion(version)
      .build();
    const document = SwaggerModule.createDocument(app, config);
    // Have to set up custom JS/CSS for Swagger in order for it to
    // work on Vercel deployment. https://stackoverflow.com/questions/73960298/nestjs-swagger-css-not-loading-when-deployed-to-vercel
    SwaggerModule.setup('api', app, document, {
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-standalone-preset.min.js',
      ],
      customCssUrl: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.min.css',
      ],
    });
  }
}
bootstrap();
