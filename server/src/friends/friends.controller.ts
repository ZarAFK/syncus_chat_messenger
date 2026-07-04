import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CreateFriendDto } from './dto/create-friend.dto';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // A kirim permintaan ke B
  @Post()
  create(@Body() createFriendDto: CreateFriendDto) {
    return this.friendsService.create(createFriendDto);
  }

  @Get()
  findAll(@Query('userId') userId: number) {
    return this.friendsService.getFriends(userId);
  }

  @Get('relations')
  getRelations(@Query('userId') userId: number) {
    return this.friendsService.getAllRelations(userId);
  }

  @Get('pending')
  getPendingRequests(@Query('userId') userId: number) {
    return this.friendsService.getPendingRequests(userId);
  }

  @Get('request')
  getFriendRequests(@Query('userId') userId: number) {
    return this.friendsService.getFriendRequests(userId);
  }

  // Accept friend request
  @Patch(':id/accept')
  accept(@Param('id') id: number) {
    return this.friendsService.acceptFriendRequest(id);
  }

  // Reject friend request
  @Patch(':id/reject')
  reject(@Param('id') id: number) {
    return this.friendsService.rejectFriendRequest(id);
  }

  // Delete relationship (unfriend)
  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.friendsService.deleteRelation(id);
  }
}
