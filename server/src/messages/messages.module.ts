import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Users } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { MessagesController } from './messages.controller';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Users, Room]),
    AuthModule,
    NotificationModule,
  ],
  providers: [MessagesGateway, MessagesService],
  exports: [MessagesService],
  controllers: [MessagesController],
})
export class MessagesModule {}
