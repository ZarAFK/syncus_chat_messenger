import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { UserStatus } from './user-status.entity';
import { Users } from './user.entity';

@Entity('user_status_views')
@Unique(['status', 'viewer'])
export class UserStatusView {
  @PrimaryGeneratedColumn()
  view_id: number;

  @ManyToOne(() => UserStatus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'status_id' })
  status: UserStatus;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'viewer_id' })
  viewer: Users;

  @CreateDateColumn({ type: 'timestamp' })
  viewed_at: Date;
}
