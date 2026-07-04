import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/db.config';
import { ConfigService, ConfigModule } from '@nestjs/config';

// feature modules
import { MessagesModule } from './messages/messages.module';
import { MessagesReadReceiptsModule } from './messages_read_receipts/messages_read_receipts.module';
import { FriendsModule } from './friends/friends.module';
import { RoomsModule } from './rooms/rooms.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotificationModule } from './notification/notification.module';
import { ProfileModule } from './profile/profile.module';
import { RoomsCategoryModule } from './rooms_category/rooms_category.module';
import { RoomMembersModule } from './room_members/room_members.module';
import { MediaModule } from './media/media.module';
import { PresenceModule } from './presence/presence.module';
import { BlockeduserModule } from './blockeduser/blockeduser.module';
import { AuthGuestModule } from './auth-guest/auth-guest.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        typeOrmConfig(configService),
      inject: [ConfigService],
    }),

    MessagesModule,
    AuthModule,
    MessagesReadReceiptsModule,
    FriendsModule,
    RoomsModule,
    UsersModule,
    MediaModule,
    RoomsCategoryModule,
    RoomMembersModule,
    NotificationModule,
    ProfileModule,
    PresenceModule,
    BlockeduserModule,
    AuthGuestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
