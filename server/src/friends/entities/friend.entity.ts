import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { FriendStatus } from '../interface/friend.interface';
import { Users } from 'src/users/entities/user.entity';

@Entity('friends')
@Unique(['user_id', 'friend_id'])
export class Friend {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'user_id' })
  user_id: Users;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'friend_id' })
  friend_id: Users;

  @Column({ type: 'enum', enum: FriendStatus, default: FriendStatus.PENDING })
  status: FriendStatus;

  @CreateDateColumn({ type: 'timestamp' })
  requested_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  accepted_at: Date;

  @CreateDateColumn()
  created_at: Date;
  length: number;
}
