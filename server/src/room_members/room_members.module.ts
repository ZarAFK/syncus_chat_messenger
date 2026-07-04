import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomMembersService } from './room_members.service';
import { RoomMembersGateway } from './room_members.gateway';
import { RoomMember } from './entities/room_member.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Users } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoomMember, Room, Users])],
  providers: [RoomMembersGateway, RoomMembersService],
  exports: [RoomMembersService],
})
export class RoomMembersModule {}
