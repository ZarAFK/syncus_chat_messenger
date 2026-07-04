import { Users } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { notificationType } from '../interface/notification.interface';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  notification_id: number;

  @ManyToOne(() => Users, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column({ type: 'enum', enum: notificationType })
  type: notificationType;

  @Column({ type: 'int', nullable: true })
  related_id?: number;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @ManyToOne(() => Users, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender?: Users;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
