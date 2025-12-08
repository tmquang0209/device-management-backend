import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: true,
  transports: ['websocket', 'polling'],
  allowEI03: true,
})
export class EventGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  afterInit(server: any) {
    Logger.log('Init EventGateway');
    this.server = server;
  }

  handleConnection(client: any, ...args: any[]) {
    Logger.log('Client connected: ' + client.id, EventGateway.name, args);
  }

  handleDisconnect(client: any) {
    Logger.log('Client disconnected: ' + client.id, EventGateway.name);
  }
}
