import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Server, Socket } from 'socket.io';
import { Message } from './entities/message.entity';
import { NotificationService } from 'src/notification/notification.service';
import { notificationType } from 'src/notification/interface/notification.interface';

@WebSocketGateway({ cors: true })
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly notificationService: NotificationService,
  ) {}

  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const msg = await this.messagesService.create(createMessageDto);
    this.server.to(`room_${createMessageDto.room_id}`).emit('newMessage', msg);
    if (createMessageDto.receiver_id) {
      this.server.to(`user_${createMessageDto.receiver_id}`).emit('newMessage', msg);
      
      // Create message notification for recipient
      await this.notificationService.create(
        createMessageDto.receiver_id,
        createMessageDto.sender_id,
        notificationType.NEW_MESSAGE,
        msg.id,
        `@${msg.sender?.username || 'System'} mengirimkan pesan baru.`,
      );
    }
    return msg;
  }

  @SubscribeMessage('findAllMessagesByRoom')
  async findAllByRoom(@MessageBody() body: { roomId: number }): Promise<Message[]> {
    return this.messagesService.findByRoomId(body.roomId);
  }

  @SubscribeMessage('findAllMediaByRoom')
  async findAllMediaByRoom(@MessageBody() body: { roomId: number }): Promise<Message[]> {
    return this.messagesService.findMediaByRoomId(body.roomId);
  }

  @SubscribeMessage('findAllMessages')
  findAll() {
    return this.messagesService.findAll();
  }

  @SubscribeMessage('findOneMessage')
  findOne(@MessageBody() id: number) {
    return this.messagesService.findOne(id);
  }

  @SubscribeMessage('updateMessage')
  update(@MessageBody() updateMessageDto: UpdateMessageDto) {
    const updatedMsg = this.messagesService.update(
      updateMessageDto.id,
      updateMessageDto,
    );
    this.server.emit('updatedMessage', updatedMsg);
    return updatedMsg;
  }

  @SubscribeMessage('removeMessage')
  remove(@MessageBody() id: number) {
    const result = this.messagesService.remove(id);
    this.server.emit('removedMessage', id);
    return { id, result };
  }

  @SubscribeMessage('pinMessage')
  async pinMessage(
    @MessageBody() body: { roomId: number | string; messageId: number; message: any },
  ) {
    await this.messagesService.update(body.messageId, { is_pinned: true } as any);
    this.server.to(`room_${body.roomId}`).emit('messagePinned', body);
  }

  @SubscribeMessage('unpinMessage')
  async unpinMessage(
    @MessageBody() body: { roomId: number | string; messageId: number },
  ) {
    await this.messagesService.update(body.messageId, { is_pinned: false } as any);
    this.server.to(`room_${body.roomId}`).emit('messageUnpinned', body);
  }

  @SubscribeMessage('reactMessage')
  async reactMessage(
    @MessageBody() body: { roomId: number | string; messageId: number; emoji: string; userId: number; username: string },
  ) {
    const message = await this.messagesService.findOne(body.messageId);
    let reactionsMap: { [emoji: string]: { userId: number; username: string }[] } = {};
    if (message.reactions) {
      try {
        reactionsMap = JSON.parse(message.reactions);
      } catch {
        reactionsMap = {};
      }
    }

    const emojiUsers = reactionsMap[body.emoji] || [];
    let newEmojiUsers;
    if (emojiUsers.some((u) => u.userId === body.userId)) {
      newEmojiUsers = emojiUsers.filter((u) => u.userId !== body.userId);
    } else {
      newEmojiUsers = [...emojiUsers, { userId: body.userId, username: body.username }];
    }

    if (newEmojiUsers.length === 0) {
      delete reactionsMap[body.emoji];
    } else {
      reactionsMap[body.emoji] = newEmojiUsers;
    }

    const updatedReactionsString = JSON.stringify(reactionsMap);
    await this.messagesService.update(body.messageId, { reactions: updatedReactionsString } as any);

    this.server.to(`room_${body.roomId}`).emit('messageReacted', {
      roomId: body.roomId,
      messageId: body.messageId,
      reactions: reactionsMap,
    });
  }
}
