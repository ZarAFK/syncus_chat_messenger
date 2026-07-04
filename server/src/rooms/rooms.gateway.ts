import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';

// DTO tambahan untuk findOne & remove
export class FindOneRoomDto {
  id: number;
}

export class RemoveRoomDto {
  id: number;
}

@WebSocketGateway({
  cors: {
    origin: '*', // ganti dengan FE URL di production
  },
})
export class RoomsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomsService: RoomsService) {}

  @SubscribeMessage('joinPrivateRoom')
  async joinPrivateRoom(
    @MessageBody() body: { userAId: number; userBId: number },
    @ConnectedSocket() client: Socket,
  ): Promise<{ event: string; data: Room | string }> {
    try {
      const room = await this.roomsService.getOrCreatePrivateRoom(
        body.userAId,
        body.userBId,
      );
      client.join(`room_${room.room_id}`);
      return { event: 'joinedPrivateRoom', data: room };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { event: 'joinPrivateRoomError', data: message };
    }
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody() body: { roomId: number },
    @ConnectedSocket() client: Socket,
  ): Promise<{ success: boolean; data?: Room; error?: string }> {
    try {
      const userId = client.data.userId;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const { room, systemMessage } = await this.roomsService.joinRoom(body.roomId, userId);
      client.join(`room_${room.room_id}`);
      this.server.to(`room_${room.room_id}`).emit('roomMemberJoined', { room });
      if (systemMessage) {
        this.server.to(`room_${room.room_id}`).emit('newMessage', systemMessage);
      }
      return { success: true, data: room };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  // PROMOTE MEMBER
  @SubscribeMessage('promoteMember')
  async promoteMember(
    @MessageBody() body: { roomId: number; targetUserId: number; role: 'admin' | 'member' },
    @ConnectedSocket() client: Socket,
  ): Promise<{ event: string; data: any }> {
    try {
      const senderUserId = client.data.userId;
      if (!senderUserId) throw new Error('Unauthorized');
      
      const updatedMember = await this.roomsService.promoteMember(
        body.roomId,
        body.targetUserId,
        body.role,
        senderUserId,
      );
      
      const fullRoom = await this.roomsService.findOne(body.roomId);
      this.server.to(`room_${body.roomId}`).emit('memberRoleUpdated', {
        roomId: body.roomId,
        targetUserId: body.targetUserId,
        role: body.role,
        room: fullRoom,
      });
      
      return { event: 'promoteMemberSuccess', data: updatedMember };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { event: 'promoteMemberError', data: message };
    }
  }

  // KICK MEMBER
  @SubscribeMessage('kickMember')
  async kickMember(
    @MessageBody() body: { roomId: number; targetUserId: number },
    @ConnectedSocket() client: Socket,
  ): Promise<{ event: string; data: any }> {
    try {
      const senderUserId = client.data.userId;
      if (!senderUserId) throw new Error('Unauthorized');
      
      const result = await this.roomsService.kickMember(
        body.roomId,
        body.targetUserId,
        senderUserId,
      );
      
      const fullRoom = await this.roomsService.findOne(body.roomId);
      this.server.to(`room_${body.roomId}`).emit('memberKicked', {
        roomId: body.roomId,
        targetUserId: body.targetUserId,
        room: fullRoom,
      });
      
      this.server.to(`user_${body.targetUserId}`).emit('kickedFromRoom', {
        roomId: body.roomId,
      });

      if (result.systemMessage) {
        this.server.to(`room_${body.roomId}`).emit('newMessage', result.systemMessage);
      }
      
      return { event: 'kickMemberSuccess', data: result };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { event: 'kickMemberError', data: message };
    }
  }

  // LEAVE ROOM
  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @MessageBody() body: { roomId: number },
    @ConnectedSocket() client: Socket,
  ): Promise<{ success: boolean; data?: Room; error?: string }> {
    try {
      const userId = client.data.userId;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const { room, systemMessage } = await this.roomsService.leaveRoom(body.roomId, userId);
      client.leave(`room_${body.roomId}`);
      
      this.server.to(`room_${body.roomId}`).emit('roomMemberLeft', {
        roomId: body.roomId,
        targetUserId: userId,
        room,
      });
      
      if (systemMessage) {
        this.server.to(`room_${body.roomId}`).emit('newMessage', systemMessage);
      }
      
      return { success: true, data: room };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  // CREATE
  @SubscribeMessage('createRoom')
  async create(
    @MessageBody() createRoomDto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<{ success: boolean; data?: Room; error?: string }> {
    try {
      const room = await this.roomsService.create(createRoomDto);
      this.server.emit('roomCreated', room); // kirim ke semua client (termasuk pembuat) agar sidebar & lobby terupdate realtime
      return { success: true, data: room };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  // FIND ALL
  @SubscribeMessage('findAllRooms')
  async findAll(): Promise<{ success: boolean; data?: Room[]; error?: string }> {
    try {
      const rooms = await this.roomsService.findAll();
      return { success: true, data: rooms };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  // FIND ONE
  @SubscribeMessage('findOneRoom')
  async findOne(
    @MessageBody() body: FindOneRoomDto,
  ): Promise<{ event: string; data: Room | string }> {
    try {
      const room = await this.roomsService.findOne(body.id);
      return { event: 'findOneRoom', data: room };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { event: 'findOneRoomError', data: message };
    }
  }

  // UPDATE
  @SubscribeMessage('updateRoom')
  async update(
    @MessageBody() updateRoomDto: UpdateRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<{ success: boolean; data?: Room; error?: string }> {
    try {
      const senderUserId = client.data.userId;
      if (!senderUserId) throw new Error('Unauthorized');

      const room = await this.roomsService.findOne(updateRoomDto.id);
      const isCreator = room.creator && room.creator.user_id === senderUserId;
      
      const member = room.roomMembers.find(m => m.user?.user_id === senderUserId);
      const isAdmin = member && member.role === 'admin';
      
      if (!isCreator && !isAdmin) {
        throw new Error('You do not have permission to update group details');
      }

      const updated = await this.roomsService.update(
        updateRoomDto.id,
        updateRoomDto,
      );
      this.server.emit('roomUpdated', updated);
      return { success: true, data: updated };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  // REMOVE
  @SubscribeMessage('removeRoom')
  async remove(
    @MessageBody() body: RemoveRoomDto,
  ): Promise<{ event: string; data: number | string }> {
    try {
      await this.roomsService.remove(body.id);
      this.server.emit('roomRemoved', body.id);
      return { event: 'removeRoom', data: body.id };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { event: 'removeRoomError', data: message };
    }
  }
}

// import {
//   WebSocketGateway,
//   SubscribeMessage,
//   MessageBody,
// } from '@nestjs/websockets';
// import { RoomsService } from './rooms.service';
// import { CreateRoomDto } from './dto/create-room.dto';
// import { UpdateRoomDto } from './dto/update-room.dto';

// @WebSocketGateway({})
// export class RoomsGateway {
//   constructor(private readonly roomsService: RoomsService) {}

//   @SubscribeMessage('createRoom')
//   create(@MessageBody() createRoomDto: CreateRoomDto) {
//     return this.roomsService.create(createRoomDto);
//   }

//   @SubscribeMessage('findAllRooms')
//   findAll() {
//     return this.roomsService.findAll();
//   }

//   @SubscribeMessage('findOneRoom')
//   findOne(@MessageBody() id: number) {
//     return this.roomsService.findOne(id);
//   }

//   @SubscribeMessage('updateRoom')
//   update(@MessageBody() updateRoomDto: UpdateRoomDto) {
//     return this.roomsService.update(updateRoomDto.id, updateRoomDto);
//   }

//   @SubscribeMessage('removeRoom')
//   remove(@MessageBody() id: number) {
//     return this.roomsService.remove(id);
//   }
// }
