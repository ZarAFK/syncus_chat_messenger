import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  MessageStatusEnum,
  MessageTypeEnum,
} from '../interface/messages.interface';
import { Users } from 'src/users/entities/user.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Media } from 'src/media/entities/media.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, (user) => user.sentMessages, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender?: Users;

  @ManyToOne(() => Room, (room) => room.messages, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room?: Room;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: MessageStatusEnum,
    default: MessageStatusEnum.SENT,
  })
  status: MessageStatusEnum;

  @Column({
    type: 'enum',
    enum: MessageTypeEnum,
    default: MessageTypeEnum.TEXT,
  })
  type: MessageTypeEnum;

  @OneToMany(() => Media, (media) => media.message_fk, { cascade: true })
  media: Media[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'boolean', default: false })
  is_pinned: boolean;

  @Column({ type: 'text', nullable: true })
  reactions?: string;
}
