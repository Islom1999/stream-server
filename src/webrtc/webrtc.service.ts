import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class WebrtcService {
  private io: Server;

  constructor() {
    // Initialize the Socket.IO server
    this.io = new Server(3000, {
      cors: {
        origin: '*',
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log('User connected', socket.id);

      socket.on('call-user', (data: any) => {
        socket.to(data.to).emit('call-made', {
          signal: data.signal,
          from: socket.id,
        });
      });

      socket.on('make-answer', (data: any) => {
        socket.to(data.to).emit('call-answered', {
          signal: data.signal,
        });
      });

      socket.on('ice-candidate', (data: any) => {
        socket.to(data.to).emit('ice-candidate', {
          candidate: data.candidate,
        });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
      });
    });
  }
}
