import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { Friend } from './entities/friend.entity';
import { CreateFriendDto } from './dto/create-friend.dto';
import { FriendStatus } from './interface/friend.interface'; // pastikan path benar
import { Users } from 'src/users/entities/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { notificationType } from 'src/notification/interface/notification.interface';


@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createFriendDto: CreateFriendDto) {
    const { user_id, friend_id } = createFriendDto;

    // cek user valid
    const user = await this.userRepository.findOne({
      where: { user_id: user_id },
    });
    const friendUser = await this.userRepository.findOne({
      where: { user_id: friend_id },
    });

    if (!user || !friendUser) {
      throw new NotFoundException('User not found');
    }

    // cek apakah sudah ada relasi A-B atau B-A
    const existingFriend = await this.friendRepository
      .createQueryBuilder('friend')
      .leftJoinAndSelect('friend.user_id', 'user')
      .leftJoinAndSelect('friend.friend_id', 'friendUser')
      .where(
        '((friend.user_id = :userId AND friend.friend_id = :friendId) OR (friend.user_id = :friendId AND friend.friend_id = :userId))',
        { userId: user_id, friendId: friend_id }
      )
      .getOne();

    if (existingFriend) {
      throw new BadRequestException(
        'Friend request already exists or already friends',
      );
    }

    const friend = this.friendRepository.create({
      user_id: user,
      friend_id: friendUser,
      status: FriendStatus.PENDING,
    });

    const savedFriend = await this.friendRepository.save(friend);

    // Create a notification for friendUser (recipient)
    await this.notificationService.create(
      friendUser.user_id,
      user.user_id,
      notificationType.FRIEND_REQUEST,
      savedFriend.id,
      `@${user.username} mengirimkan permintaan pertemanan.`,
    );

    return savedFriend;
  }

  async acceptFriendRequest(id: number) {
    const friendRequest = await this.friendRepository.findOne({
      where: { id },
      relations: ['user_id', 'friend_id'],
    });
    if (!friendRequest) throw new NotFoundException('Friend request not found');

    friendRequest.status = FriendStatus.ACCEPTED;
    friendRequest.accepted_at = new Date();
    const saved = await this.friendRepository.save(friendRequest);

    // Create a notification for the sender (user_id)
    await this.notificationService.create(
      friendRequest.user_id.user_id,
      friendRequest.friend_id.user_id,
      notificationType.FRIEND_ACCEPT,
      saved.id,
      `@${friendRequest.friend_id.username} menerima permintaan pertemanan Anda.`,
    );

    // Clean up the friend request notification for the receiver
    await this.notificationService.removeByRelatedIdAndType(id, notificationType.FRIEND_REQUEST);

    return saved;
  }

  async rejectFriendRequest(id: number) {
    const friendRequest = await this.friendRepository.findOne({
      where: { id },
    });
    if (!friendRequest) throw new NotFoundException('Friend request not found');

    friendRequest.status = FriendStatus.REJECTED;
    const saved = await this.friendRepository.save(friendRequest);

    // Clean up the friend request notification
    await this.notificationService.removeByRelatedIdAndType(id, notificationType.FRIEND_REQUEST);

    return saved;
  }

  async getFriends(userId: number) {
    const friendExists = await this.friendRepository
      .createQueryBuilder('friend')
      .where('friend.user_id = :userId OR friend.friend_id = :userId', { userId })
      .getOne();

    if (!friendExists) {
      throw new NotFoundException('No friend found');
    }

    return this.friendRepository
      .createQueryBuilder('friend')
      .leftJoinAndSelect('friend.user_id', 'user')
      .leftJoinAndSelect('friend.friend_id', 'friendUser')
      .where(
        '((friend.user_id = :userId OR friend.friend_id = :userId) AND friend.status = :status)',
        { userId, status: FriendStatus.ACCEPTED }
      )
      .getMany();
  }

  async getFriendRequests(userId: number) {
    const request = await this.friendRepository
      .createQueryBuilder('friend')
      .leftJoinAndSelect('friend.user_id', 'user')
      .leftJoinAndSelect('friend.friend_id', 'friendUser')
      .where('friend.friend_id = :userId AND friend.status = :status', {
        userId,
        status: FriendStatus.PENDING,
      })
      .getOne();

    if (!request) {
      throw new NotFoundException('No Friend here bro');
    }
    return request;
  }

  async getPendingRequests(userId: number) {
    return this.friendRepository
      .createQueryBuilder('friend')
      .leftJoinAndSelect('friend.user_id', 'user')
      .where('friend.friend_id = :userId AND friend.status = :status', {
        userId,
        status: FriendStatus.PENDING,
      })
      .getMany();
  }

  async getAllRelations(userId: number) {
    return this.friendRepository
      .createQueryBuilder('friend')
      .leftJoinAndSelect('friend.user_id', 'user')
      .leftJoinAndSelect('friend.friend_id', 'friendUser')
      .where('friend.user_id = :userId OR friend.friend_id = :userId', { userId })
      .getMany();
  }

  async deleteRelation(id: number) {
    const relation = await this.friendRepository.findOne({ where: { id } });
    if (!relation) throw new NotFoundException('Relation not found');
    return this.friendRepository.remove(relation);
  }
}
