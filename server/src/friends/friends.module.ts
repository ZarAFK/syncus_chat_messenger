import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend } from './entities/friend.entity';
import { Users } from 'src/users/entities/user.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friend, Users]),
    NotificationModule,
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
