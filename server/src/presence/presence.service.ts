import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Presence } from './entities/presence.entity';
import { CreatePresenceDto } from './dto/create-presence.dto';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { Users } from 'src/users/entities/user.entity';

@Injectable()
export class PresenceService {
  constructor(
    @InjectRepository(Presence)
    private readonly presenceRepo: Repository<Presence>,
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
  ) {}

  async create(createPresenceDto: CreatePresenceDto) {
    const { user_id, room_id } = createPresenceDto;

    const user = await this.usersRepo.findOne({ where: { user_id } });
    if (!user) throw new NotFoundException(`User ${user_id} not found`);

    const presence = this.presenceRepo.create({
      user,
      room: room_id ? ({ room_id } as any) : null,
      is_online: true,
      last_seen: new Date(),
    });

    return this.presenceRepo.save(presence);
  }

  async findAll() {
    return this.presenceRepo.find({
      relations: ['user', 'room'],
    });
  }

  async findOne(id: number) {
    const presence = await this.presenceRepo.findOne({
      where: { presence_id: id },
      relations: ['user', 'room'],
    });
    if (!presence) throw new NotFoundException(`Presence ${id} not found`);
    return presence;
  }

  async update(id: number, updatePresenceDto: UpdatePresenceDto) {
    const presence = await this.presenceRepo.findOne({
      where: { presence_id: id },
    });
    if (!presence) throw new NotFoundException(`Presence ${id} not found`);

    Object.assign(presence, updatePresenceDto, { last_seen: new Date() });
    return this.presenceRepo.save(presence);
  }

  async remove(id: number) {
    const presence = await this.presenceRepo.findOne({
      where: { presence_id: id },
    });
    if (!presence) throw new NotFoundException(`Presence ${id} not found`);

    presence.is_online = false;
    presence.last_seen = new Date();
    await this.presenceRepo.save(presence);

    return { message: `Presence ${id} set offline`, presence };
  }

  async getOnlineUsers() {
    return this.presenceRepo.find({
      where: { is_online: true },
      relations: ['user'],
    });
  }

  async updateStatus(userId: number, update: Partial<Presence>) {
    // Ambil presence berdasarkan user_id
    let presence = await this.presenceRepo.findOne({
      where: { user: { user_id: userId } },
      relations: ['user'],
    });

    // Update users table status
    if (update.is_online !== undefined) {
      await this.usersRepo.update(
        { user_id: userId },
        { is_online: update.is_online, last_seen: update.last_seen || new Date() },
      );
    }

    // Kalau belum ada, buat baru dengan relasi user yang valid
    if (!presence) {
      const user = await this.usersRepo.findOne({ where: { user_id: userId } });
      if (!user) throw new NotFoundException(`User ${userId} not found`);

      presence = this.presenceRepo.create({
        user,
        ...update,
        last_seen: new Date(),
      });

      await this.presenceRepo.save(presence);
    } else {
      Object.assign(presence, update, { last_seen: new Date() });
      await this.presenceRepo.save(presence);
    }

    return presence;
  }
}
