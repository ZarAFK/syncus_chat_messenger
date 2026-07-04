import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { UserStatus } from './entities/user-status.entity';
import { UserStatusView } from './entities/user-status-view.entity';
import { UserStatusComment } from './entities/user-status-comment.entity';
import { Users } from './entities/user.entity';
import { StatusStorageService } from './status-storage.service';

@Injectable()
export class StatusService implements OnModuleInit {
  constructor(
    @InjectRepository(UserStatus)
    private readonly statusRepo: Repository<UserStatus>,
    @InjectRepository(UserStatusView)
    private readonly viewRepo: Repository<UserStatusView>,
    @InjectRepository(UserStatusComment)
    private readonly commentRepo: Repository<UserStatusComment>,
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
    private readonly storageService: StatusStorageService,
  ) {}

  onModuleInit() {
    // Run pruning job every hour (3600000 ms)
    setInterval(() => {
      this.pruneExpiredStatuses().catch(err => {
        console.error('Failed to run status pruning interval:', err);
      });
    }, 3600000);

    // Run pruning immediately on startup
    this.pruneExpiredStatuses().catch(() => {});
  }

  async createStatus(userId: number, text?: string, emoji?: string, base64Images?: string[]) {
    const user = await this.usersRepo.findOneBy({ user_id: userId });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    let imagePaths: string[] | undefined = undefined;
    if (base64Images && base64Images.length > 0) {
      imagePaths = await this.storageService.saveMultipleImages(userId, base64Images);
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newStatus = this.statusRepo.create({
      user,
      text,
      emoji,
      image_paths: imagePaths,
      expires_at: expiresAt,
    });

    return this.statusRepo.save(newStatus);
  }

  async getFriendStatuses(currentUserId: number) {
    // Prune expired statuses immediately on request to guarantee consistency
    await this.pruneExpiredStatuses().catch(() => {});

    const activeStatuses = await this.statusRepo.find({
      relations: ['user', 'user.profile', 'comments', 'comments.user', 'comments.user.profile'],
      order: { 
        created_at: 'DESC',
        comments: {
          created_at: 'ASC'
        }
      },
    });

    const viewedRecords = await this.viewRepo.find({
      where: { viewer: { user_id: currentUserId } },
      relations: ['status'],
    });

    const viewedStatusIds = new Set(viewedRecords.map(v => v.status.status_id));
    const grouped = new Map<number, any>();
    const now = Date.now();

    for (const status of activeStatuses) {
      if (status.user.user_id === currentUserId) continue;

      // Double-check expiration using JS local timestamp comparison (timezone-safe)
      if (status.expires_at && new Date(status.expires_at).getTime() <= now) {
        continue;
      }

      const uId = status.user.user_id;
      const isRead = viewedStatusIds.has(status.status_id);

      if (!grouped.has(uId)) {
        grouped.set(uId, {
          user_id: uId,
          username: status.user.username,
          avatar: status.user.profile?.profile_picture || '',
          country: status.user.country,
          gender: status.user.gender,
          role: status.user.role,
          last_seen: status.user.last_seen,
          is_online: status.user.is_online,
          has_unread: false,
          statuses: [],
        });
      }

      const userGroup = grouped.get(uId);
      userGroup.statuses.push({
        status_id: status.status_id,
        text: status.text,
        emoji: status.emoji,
        image_paths: status.image_paths,
        created_at: status.created_at,
        is_read: isRead,
        comments: status.comments || [],
      });

      if (!isRead) {
        userGroup.has_unread = true;
      }
    }

    return Array.from(grouped.values());
  }

  async getMyStatuses(currentUserId: number) {
    // Prune expired statuses immediately on request to guarantee consistency
    await this.pruneExpiredStatuses().catch(() => {});

    const statuses = await this.statusRepo.find({
      where: { 
        user: { user_id: currentUserId }
      },
      relations: ['comments', 'comments.user', 'comments.user.profile'],
      order: { 
        created_at: 'DESC',
        comments: {
          created_at: 'ASC'
        }
      }
    });

    const now = Date.now();
    return statuses.filter(s => s.expires_at && new Date(s.expires_at).getTime() > now);
  }

  async viewStatus(currentUserId: number, statusId: number) {
    const status = await this.statusRepo.findOneBy({ status_id: statusId });
    if (!status) throw new NotFoundException('Status tidak ditemukan');

    const viewer = { user_id: currentUserId } as Users;

    try {
      const viewLog = this.viewRepo.create({ status, viewer });
      await this.viewRepo.save(viewLog);
    } catch (e) {
      // Ignore unique violations
    }

    return { success: true };
  }

  async deleteStatus(userId: number, statusId: number) {
    const status = await this.statusRepo.findOne({
      where: { status_id: statusId, user: { user_id: userId } }
    });

    if (!status) throw new NotFoundException('Status tidak ditemukan');

    if (status.image_paths && status.image_paths.length > 0) {
      await this.storageService.deleteImage(status.image_paths);
    }

    await this.statusRepo.remove(status);
    return { success: true };
  }

  async pruneExpiredStatuses() {
    const allStatuses = await this.statusRepo.find();
    const now = Date.now();
    const expired = allStatuses.filter(s => s.expires_at && new Date(s.expires_at).getTime() <= now);

    for (const status of expired) {
      if (status.image_paths && status.image_paths.length > 0) {
        try {
          await this.storageService.deleteImage(status.image_paths);
        } catch (e) {
          console.error(`Gagal menghapus gambar status kedaluwarsa: ${status.image_paths}`, e);
        }
      }
    }

    if (expired.length > 0) {
      await this.statusRepo.remove(expired);
      console.log(`🧹 Berhasil membersihkan ${expired.length} status yang kedaluwarsa.`);
    }
  }

  async addComment(userId: number, statusId: number, text: string) {
    const status = await this.statusRepo.findOneBy({ status_id: statusId });
    if (!status) throw new NotFoundException('Status tidak ditemukan');

    const user = await this.usersRepo.findOne({
      where: { user_id: userId },
      relations: ['profile']
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const newComment = this.commentRepo.create({
      status,
      user,
      text,
    });

    return this.commentRepo.save(newComment);
  }

  async deleteComment(userId: number, commentId: number) {
    const comment = await this.commentRepo.findOne({
      where: { comment_id: commentId },
      relations: ['status', 'status.user', 'user']
    });
    if (!comment) throw new NotFoundException('Komentar tidak ditemukan');

    if (comment.user.user_id !== userId && comment.status.user.user_id !== userId) {
      throw new Error('Anda tidak memiliki akses untuk menghapus komentar ini');
    }

    await this.commentRepo.remove(comment);
    return { success: true };
  }
}
