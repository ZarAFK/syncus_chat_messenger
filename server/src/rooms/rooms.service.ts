import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Like } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomMember } from 'src/room_members/entities/room_member.entity';
import { RoomsCategory } from 'src/rooms_category/entities/rooms_category.entity';
import { Message } from 'src/messages/entities/message.entity';
import { MessageTypeEnum } from 'src/messages/interface/messages.interface';
import { Users } from 'src/users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
  ) {}

  private saveGroupIcon(roomId: number, base64Str: string): string {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 format');
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rooms');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const extension = matches[1].split('/')[1] || 'jpg';
    const filename = `room_${roomId}_${Date.now()}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, imageBuffer);
    return `/uploads/rooms/${filename}`;
  }

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const categoryRepo = this.roomsRepository.manager.getRepository(RoomsCategory);
    let categoryId = createRoomDto.category_room_id || 1;
    let category = await categoryRepo.findOneBy({ category_room_id: categoryId });
    if (!category) {
      category = categoryRepo.create({
        category_room_id: categoryId,
        room_tag: 'community',
        description: 'General category for groups',
      });
      await categoryRepo.save(category);
    }

    const room = this.roomsRepository.create({
      room_name: createRoomDto.room_name,
      room_description: createRoomDto.room_description,
      age_limit: createRoomDto.age_limit || 0,
      rule: createRoomDto.rule || '',
      fk_room_category: category,
      creator: createRoomDto.creator_id ? ({ user_id: createRoomDto.creator_id } as any) : undefined,
    });
    let savedRoom = await this.roomsRepository.save(room);

    if (createRoomDto.room_picture && createRoomDto.room_picture.startsWith('data:image/')) {
      try {
        const pictureUrl = this.saveGroupIcon(savedRoom.room_id, createRoomDto.room_picture);
        await this.roomsRepository.update(savedRoom.room_id, { room_picture: pictureUrl });
        savedRoom.room_picture = pictureUrl;
      } catch (err) {
        console.error('Failed to save group icon on create:', err);
      }
    }

    // Auto-join creator as an admin member
    if (createRoomDto.creator_id) {
      const memberRepo = this.roomsRepository.manager.getRepository(RoomMember);
      const member = memberRepo.create({
        user: { user_id: createRoomDto.creator_id } as any,
        room: savedRoom,
        role: 'admin',
      });
      await memberRepo.save(member);
    }

    return savedRoom;
  }

  async getOrCreatePrivateRoom(userAId: number, userBId: number): Promise<Room> {
    const min = Math.min(userAId, userBId);
    const max = Math.max(userAId, userBId);
    const roomName = `DM_${min}_${max}`;

    let room = await this.roomsRepository.findOne({
      where: { room_name: roomName },
      relations: ['roomMembers', 'roomMembers.user'],
    });

    if (!room) {
      room = this.roomsRepository.create({
        room_name: roomName,
        age_limit: 0,
        rule: '',
      });
      const savedRoom = await this.roomsRepository.save(room);

      const memberA = this.roomsRepository.manager.getRepository(RoomMember).create({
        user: { user_id: userAId } as any,
        room: savedRoom,
        role: 'member',
      });
      const memberB = this.roomsRepository.manager.getRepository(RoomMember).create({
        user: { user_id: userBId } as any,
        room: savedRoom,
        role: 'member',
      });
      await this.roomsRepository.manager.getRepository(RoomMember).save([memberA, memberB]);

      room = await this.roomsRepository.findOne({
        where: { room_id: savedRoom.room_id },
        relations: ['roomMembers', 'roomMembers.user'],
      });
    }

    if (!room) {
      throw new NotFoundException(`Room with name ${roomName} not found or created`);
    }

    return room;
  }

  async findAll(): Promise<Room[]> {
    return await this.roomsRepository.find({
      where: {
        room_name: Not(Like('DM_%')),
      },
      relations: ['creator', 'fk_room_category', 'roomMembers', 'roomMembers.user'],
    });
  }

  async findOne(id: number): Promise<Room> {
    const room = await this.roomsRepository.findOne({
      where: { room_id: id },
      relations: ['creator', 'fk_room_category', 'roomMembers', 'roomMembers.user'],
    });


    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  async update(id: number, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const { id: _, ...updateData } = updateRoomDto as any;
    // Remove room_picture from socket update path — use HTTP PATCH /rooms/:id/picture instead
    delete updateData.room_picture;
    await this.roomsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updateRoomPicture(id: number, pictureUrl: string): Promise<Room> {
    await this.roomsRepository.update(id, { room_picture: pictureUrl });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.roomsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
  }

  async joinRoom(roomId: number, userId: number): Promise<{ room: Room; systemMessage?: Message }> {
    const room = await this.findOne(roomId);
    
    // Check if membership already exists
    const memberRepo = this.roomsRepository.manager.getRepository(RoomMember);
    let member = await memberRepo.findOne({
      where: { room: { room_id: roomId }, user: { user_id: userId } }
    });

    let systemMessage: Message | undefined;

    if (!member) {
      member = memberRepo.create({
        room,
        user: { user_id: userId } as any,
        role: 'member',
      });
      await memberRepo.save(member);

      const userRepo = this.roomsRepository.manager.getRepository(Users);
      const user = await userRepo.findOneBy({ user_id: userId });
      const username = user ? user.username : 'Someone';

      const messageRepo = this.roomsRepository.manager.getRepository(Message);
      const msg = messageRepo.create({
        room,
        content: `@${username} joined the group`,
        type: MessageTypeEnum.SYSTEM,
      });
      systemMessage = await messageRepo.save(msg);
    }
    
    const updatedRoom = await this.findOne(roomId);
    return { room: updatedRoom, systemMessage };
  }

  async promoteMember(
    roomId: number,
    targetUserId: number,
    role: 'admin' | 'member',
    senderUserId: number,
  ): Promise<RoomMember> {
    const room = await this.findOne(roomId);
    
    // Only creator of the room can promote/demote to admin
    if (room.creator && room.creator.user_id !== senderUserId) {
      throw new Error('Only the room creator can promote or demote members');
    }

    const memberRepo = this.roomsRepository.manager.getRepository(RoomMember);
    const member = await memberRepo.findOne({
      where: { room: { room_id: roomId }, user: { user_id: targetUserId } },
      relations: ['user'],
    });

    if (!member) {
      throw new NotFoundException('Member not found in this room');
    }

    member.role = role;
    return await memberRepo.save(member);
  }

  async kickMember(
    roomId: number,
    targetUserId: number,
    senderUserId: number,
  ): Promise<{ targetUserId: number; systemMessage?: Message }> {
    const room = await this.findOne(roomId);
    
    // Check sender's authorization
    let isAuthorized = false;
    
    if (room.creator && room.creator.user_id === senderUserId) {
      // Owner can kick anyone except themselves
      if (targetUserId === senderUserId) {
        throw new Error('You cannot kick yourself');
      }
      isAuthorized = true;
    } else {
      // Check if sender is admin and target is a regular member
      const memberRepo = this.roomsRepository.manager.getRepository(RoomMember);
      const senderMember = await memberRepo.findOne({
        where: { room: { room_id: roomId }, user: { user_id: senderUserId } }
      });
      const targetMember = await memberRepo.findOne({
        where: { room: { room_id: roomId }, user: { user_id: targetUserId } }
      });
      
      if (
        senderMember && 
        senderMember.role === 'admin' && 
        targetMember && 
        targetMember.role === 'member'
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new Error('You are not authorized to kick this member');
    }

    const memberRepo = this.roomsRepository.manager.getRepository(RoomMember);
    const targetMember = await memberRepo.findOne({
      where: { room: { room_id: roomId }, user: { user_id: targetUserId } }
    });

    let systemMessage: Message | undefined;

    if (targetMember) {
      await memberRepo.remove(targetMember);

      const userRepo = this.roomsRepository.manager.getRepository(Users);
      const targetUser = await userRepo.findOneBy({ user_id: targetUserId });
      const targetUsername = targetUser ? targetUser.username : 'Someone';

      const messageRepo = this.roomsRepository.manager.getRepository(Message);
      const msg = messageRepo.create({
        room,
        content: `@${targetUsername} was removed from the group`,
        type: MessageTypeEnum.SYSTEM,
      });
      systemMessage = await messageRepo.save(msg);
    }

    return { targetUserId, systemMessage };
  }

  async leaveRoom(
    roomId: number,
    userId: number,
  ): Promise<{ room: Room; systemMessage?: Message }> {
    const room = await this.findOne(roomId);

    const memberRepo = this.roomsRepository.manager.getRepository(RoomMember);
    const targetMember = await memberRepo.findOne({
      where: { room: { room_id: roomId }, user: { user_id: userId } }
    });

    let systemMessage: Message | undefined;

    if (targetMember) {
      const isOwner = room.creator && room.creator.user_id === userId;
      if (isOwner) {
        const hasOtherAdmin = room.roomMembers.some(
          (m) => m.user?.user_id !== userId && m.role === 'admin'
        );
        if (!hasOtherAdmin) {
          throw new Error('Pemilik grup tidak dapat keluar sebelum menunjuk anggota lain sebagai admin.');
        }
      }

      await memberRepo.remove(targetMember);

      const userRepo = this.roomsRepository.manager.getRepository(Users);
      const user = await userRepo.findOneBy({ user_id: userId });
      const username = user ? user.username : 'Someone';

      const messageRepo = this.roomsRepository.manager.getRepository(Message);
      const msg = messageRepo.create({
        room,
        content: `@${username} left the group`,
        type: MessageTypeEnum.SYSTEM,
      });
      systemMessage = await messageRepo.save(msg);
    }

    const updatedRoom = await this.findOne(roomId);
    return { room: updatedRoom, systemMessage };
  }
}


// import { Injectable } from '@nestjs/common';
// import { CreateRoomDto } from './dto/create-room.dto';
// import { UpdateRoomDto } from './dto/update-room.dto';

// @Injectable()
// export class RoomsService {
//   create(createRoomDto: CreateRoomDto) {
//     return 'This action adds a new room';
//   }

//   findAll() {
//     return `This action returns all rooms`;
//   }

//   findOne(id: number) {
//     return `This action returns a #${id} room`;
//   }

//   update(id: number, updateRoomDto: UpdateRoomDto) {
//     return `This action updates a #${id} room`;
//   }

//   remove(id: number) {
//     return `This action removes a #${id} room`;
//   }
// }
