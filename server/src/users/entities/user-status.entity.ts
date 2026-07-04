import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Users } from './user.entity';
import { UserStatusComment } from './user-status-comment.entity';

@Entity('user_statuses')
export class UserStatus {
  @PrimaryGeneratedColumn()
  status_id: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column({ nullable: true, type: 'varchar', length: 250 })
  text?: string;

  @Column({ nullable: true, type: 'varchar', length: 10 })
  emoji?: string;

  @Column({ type: 'simple-json', nullable: true })
  image_paths?: string[];

  @OneToMany(() => UserStatusComment, (comment) => comment.status, { cascade: true })
  comments: UserStatusComment[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;
}
