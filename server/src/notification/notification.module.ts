import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Users } from 'src/users/entities/user.entity';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationController } from './notification.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwt_constants } from 'src/auth/constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Users]),
    JwtModule.register({
      secret: jwt_constants.secret,
      signOptions: { expiresIn: '3h' },
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationGateway, NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

