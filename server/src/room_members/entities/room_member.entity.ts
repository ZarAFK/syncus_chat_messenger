import { Room } from 'src/rooms/entities/room.entity';
import { Users } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('room_members')
export class RoomMember {
  @PrimaryGeneratedColumn()
  session_member_room_id: number;

  @ManyToOne(() => Users, (user) => user.roomMembers)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Room, (room) => room.roomMembers)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ type: 'timestamp', name: 'left_at', nullable: true })
  leftAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'member' })
  role: 'admin' | 'member';
}

