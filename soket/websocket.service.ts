import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class WebSocketService {
  private server: Server;
  private offers = [];
  private connectedSockets = [];

  public setServer(server: Server) {
    this.server = server;
    this.initializeEvents();
  }

  private initializeEvents() {
    this.server.on('connection', (socket: Socket) => {
      const userName = socket.handshake.auth.userName;
      const password = socket.handshake.auth.password;

      if (password !== 'x') {
        socket.disconnect(true);
        return;
      }
      this.connectedSockets.push({
        socketId: socket.id,
        userName,
      });

      if (this.offers.length) {
        socket.emit('availableOffers', this.offers);
      }

      socket.on('newOffer', (newOffer) => {
        this.offers.push({
          offererUserName: userName,
          offer: newOffer,
          offerIceCandidates: [],
          answererUserName: null,
          answer: null,
          answererIceCandidates: [],
        });
        socket.broadcast.emit('newOfferAwaiting', this.offers.slice(-1));
      });

      socket.on('newAnswer', (offerObj, ackFunction) => {
        const socketToAnswer = this.connectedSockets.find(s => s.userName === offerObj.offererUserName);
        if (!socketToAnswer) {
          console.log('No matching socket');
          return;
        }
        const socketIdToAnswer = socketToAnswer.socketId;
        const offerToUpdate = this.offers.find(o => o.offererUserName === offerObj.offererUserName);
        if (!offerToUpdate) {
          console.log('No OfferToUpdate');
          return;
        }
        ackFunction(offerToUpdate.offerIceCandidates);
        offerToUpdate.answer = offerObj.answer;
        offerToUpdate.answererUserName = userName;
        socket.to(socketIdToAnswer).emit('answerResponse', offerToUpdate);
      });

      socket.on('sendIceCandidateToSignalingServer', (iceCandidateObj) => {
        const { didIOffer, iceUserName, iceCandidate } = iceCandidateObj;
        if (didIOffer) {
          const offerInOffers = this.offers.find(o => o.offererUserName === iceUserName);
          if (offerInOffers) {
            offerInOffers.offerIceCandidates.push(iceCandidate);
            if (offerInOffers.answererUserName) {
              const socketToSendTo = this.connectedSockets.find(s => s.userName === offerInOffers.answererUserName);
              if (socketToSendTo) {
                socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
              } else {
                console.log('Ice candidate received but could not find answerer');
              }
            }
          }
        } else {
          const offerInOffers = this.offers.find(o => o.answererUserName === iceUserName);
          const socketToSendTo = this.connectedSockets.find(s => s.userName === offerInOffers.offererUserName);
          if (socketToSendTo) {
            socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer', iceCandidate);
          } else {
            console.log('Ice candidate received but could not find offerer');
          }
        }
      });
    });
  }
}
