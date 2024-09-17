import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import * as https from 'https';
import { Server } from 'socket.io';
import { WebSocketService } from 'soket/websocket.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const key = readFileSync('cert.key');
  const cert = readFileSync('cert.crt');

  const httpsServer = https.createServer({ key, cert }, app.getHttpAdapter().getInstance());

  const io = new Server(httpsServer, {
    cors: {
      origin: [
        'https://localhost',
        // 'https://LOCAL-DEV-IP-HERE'
      ],
      methods: ['GET', 'POST'],
    },
  });

  const webSocketService = app.get(WebSocketService);
  webSocketService.setServer(io);

  await app.listen(8181);
}

bootstrap();
