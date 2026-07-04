import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

import { Users } from 'src/users/entities/user.entity';
import { PresenceService } from './presence.service';
import { CreatePresenceDto } from './dto/create-presence.dto';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { jwt_constants } from 'src/auth/constants';

@WebSocketGateway({ cors: { origin: '*' } })
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, Set<string>>();

  constructor(
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
    private readonly jwtService: JwtService,
    private readonly presenceService: PresenceService,
  ) {}

  /**
   * 🔐 Ekstrak userId dari token JWT di handshake socket
   */
  private extractUserId(client: Socket): number | null {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return null;

      const payload = this.jwtService.verify<{ id?: number; sub?: number }>(token, {
        secret: jwt_constants.secret,
      });

      return payload.sub || payload.id || null;
    } catch (error) {
      console.error('❌ JWT verification failed:', (error as Error).message);
      return null;
    }
  }

  /**
   * ✅ Ketika user connect
   */
  async handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    if (!userId) {
      console.log('❌ Invalid token, disconnecting...');
      client.disconnect();
      return;
    }

    client.data.userId = userId; // ✅ Simpan di memory socket
    client.join(`user_${userId}`); // ✅ Join personal user room

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)?.add(client.id);

    await this.presenceService.updateStatus(userId, {
      is_online: true,
      last_seen: new Date(),
    });

    console.log(`✅ User ${userId} connected`);

    this.server.emit('userOnline', { userId });

    const onlineUsers = await this.presenceService.getOnlineUsers();
    const formatted = onlineUsers.map((p) => ({
      user_id: p.user.user_id,
      username: p.user.username,
      role: p.user.role,
      last_seen: p.last_seen,
      is_online: p.is_online,
    }));
    this.server.emit('onlineUsers', formatted);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId; // ✅ ambil dari memory
    if (!userId) {
      console.log('❌ Unknown client disconnected');
      return;
    }

    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.delete(client.id);

      if (userSockets.size === 0) {
        this.userSockets.delete(userId);

        await this.presenceService.updateStatus(userId, {
          is_online: false,
          last_seen: new Date(),
        });

        console.log(`❌ User ${userId} disconnected`);
        this.server.emit('userOffline', { userId });

        const onlineUsers = await this.presenceService.getOnlineUsers();
        const formatted = onlineUsers.map((p) => ({
          user_id: p.user.user_id,
          username: p.user.username,
          role: p.user.role,
          last_seen: p.last_seen,
          is_online: p.is_online,
        }));
        this.server.emit('onlineUsers', formatted);
      }
    }
  }

  /**
   * 🧩 Dapatkan semua user online (via event)
   */
  @SubscribeMessage('getOnlineUsers')
  async getOnlineUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() _: any,
  ) {
    const online = await this.presenceService.getOnlineUsers();

    const result = online.map((p) => ({
      user_id: p.user.user_id,
      username: p.user.username,
      role: p.user.role,
      last_seen: p.last_seen,
      is_online: p.is_online,
    }));

    console.log('📡 Sending online users list:', result);
    return result;
  }

  /**
   * CRUD event opsional
   */
  @SubscribeMessage('createPresence')
  create(@MessageBody() dto: CreatePresenceDto) {
    return this.presenceService.create(dto);
  }

  @SubscribeMessage('findOnePresence')
  findOne(@MessageBody() id: number) {
    return this.presenceService.findOne(id);
  }

  @SubscribeMessage('updatePresence')
  update(@MessageBody() dto: UpdatePresenceDto) {
    return this.presenceService.update(dto.id, dto);
  }

  @SubscribeMessage('removePresence')
  remove(@MessageBody() id: number) {
    return this.presenceService.remove(id);
  }
}
