import { Module } from '@nestjs/common';
import { RoomsCategoryService } from './rooms_category.service';
import { RoomsCategoryController } from './rooms_category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsCategory } from './entities/rooms_category.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoomsCategory, Room])],
  controllers: [RoomsCategoryController],
  providers: [RoomsCategoryService],
})
export class RoomsCategoryModule {}
