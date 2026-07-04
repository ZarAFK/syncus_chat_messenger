import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserStatus } from './user-status.entity';
import { Users } from './user.entity';

@Entity('user_status_comments')
export class UserStatusComment {
  @PrimaryGeneratedColumn()
  comment_id: number;

  @Column({ type: 'varchar', length: 250 })
  text: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => UserStatus, (status) => status.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'status_id' })
  status: UserStatus;

  @ManyToOne(() => Users, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
