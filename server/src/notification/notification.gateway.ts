import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NotificationService } from './notification.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly notificationService: NotificationService) {}

  afterInit(server: Server) {
    this.notificationService.setServer(server);
  }
}
