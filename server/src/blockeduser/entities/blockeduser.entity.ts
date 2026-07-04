import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Users } from 'src/users/entities/user.entity';

@Entity('blocked_users')
export class BlockedUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'blocked_user_id' })
  blockedUser: Users;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
