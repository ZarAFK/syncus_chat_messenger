import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from 'socket.io';
import { Notification } from './entities/notification.entity';
import { notificationType } from './interface/notification.interface';
import { Users } from 'src/users/entities/user.entity';

@Injectable()
export class NotificationService {
  private server: Server;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async create(
    userId: number,
    senderId: number,
    type: notificationType,
    relatedId?: number,
    message?: string,
  ) {
    const user = await this.userRepository.findOne({ where: { user_id: userId } });
    if (!user) return null;

    let sender: Users | undefined = undefined;
    if (senderId) {
      const foundSender = await this.userRepository.findOne({ where: { user_id: senderId } });
      if (foundSender) sender = foundSender;
    }

    const notification = this.notificationRepository.create({
      user,
      sender,
      type,
      related_id: relatedId,
      message,
      is_read: false,
    });

    const saved = await this.notificationRepository.save(notification);

    // Emit real-time event
    if (this.server) {
      const fullNotification = await this.notificationRepository.findOne({
        where: { notification_id: saved.notification_id },
        relations: ['sender', 'user'],
      });
      this.server.to(`user_${userId}`).emit('newNotification', fullNotification);
    }

    return saved;
  }

  async findAll(userId: number) {
    return this.notificationRepository.find({
      where: { user: { user_id: userId } },
      relations: ['sender'],
      order: { created_at: 'DESC' },
    });
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { notification_id: id, user: { user_id: userId } },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.is_read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepository.update(
      { user: { user_id: userId }, is_read: false },
      { is_read: true },
    );
    return { success: true };
  }

  async remove(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { notification_id: id, user: { user_id: userId } },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.notificationRepository.remove(notification);
    return { success: true };
  }

  async removeByRelatedIdAndType(relatedId: number, type: notificationType) {
    await this.notificationRepository.delete({ related_id: relatedId, type });
  }
}

