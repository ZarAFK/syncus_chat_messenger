import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Entity('presence')
export class Presence {
  @PrimaryGeneratedColumn()
  presence_id: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Room, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room?: Room;

  @Column({ default: false })
  is_online: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  last_seen?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
