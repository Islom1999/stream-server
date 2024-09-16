import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createServer } from 'http';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const httpServer = createServer();
  app.enableCors()

  await app.listen(3000); // NestJS server ham shu portda eshitadi
}
bootstrap();
