import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { Auth } from 'src/auth/entities/auth.entity';
import { UserStatus } from './entities/user-status.entity';
import { UserStatusView } from './entities/user-status-view.entity';
import { UserStatusComment } from './entities/user-status-comment.entity';
import { StatusStorageService } from './status-storage.service';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Auth, UserStatus, UserStatusView, UserStatusComment])],
  controllers: [UsersController, StatusController],
  providers: [UsersService, StatusStorageService, StatusService],
  exports: [UsersService, StatusService],
})
export class UsersModule {}
