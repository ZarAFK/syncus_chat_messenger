import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';
import { Room } from './entities/room.entity';
import { RoomMember } from 'src/room_members/entities/room_member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomMember, Users]), AuthModule],
  providers: [RoomsGateway, RoomsService],
  controllers: [RoomsController],
  exports: [RoomsService, RoomsGateway],
})
export class RoomsModule {}


