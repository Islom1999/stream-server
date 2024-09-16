import { WebSocketGateway, SubscribeMessage, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebrtcGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('WebRTC Gateway Initialized');
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    this.server.emit('user-disconnected', client.id);
  }

  @SubscribeMessage('call-user')
  handleCallUser(client: Socket, payload: { to: string, signal: any }) {
    this.server.to(payload.to).emit('call-made', { signal: payload.signal, from: client.id });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(client: Socket, payload: { to: string, candidate: any }) {
    this.server.to(payload.to).emit('ice-candidate', { candidate: payload.candidate, from: client.id });
  }
}
