import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { Users } from 'src/users/entities/user.entity';
import { Message } from 'src/messages/entities/message.entity';
import { RoomsCategory } from 'src/rooms_category/entities/rooms_category.entity';
import { RoomMember } from 'src/room_members/entities/room_member.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  room_id: number;

  @Column({ nullable: false })
  room_name: string;

  @Column({ nullable: true, type: 'text' })
  room_description: string;

  @Column({ nullable: true, type: 'text' })
  room_picture: string;

  @ManyToOne(
    () => RoomsCategory,
    (room_category) => room_category.category_room_id,
  )
  @JoinColumn({ name: 'category_room_id' })
  fk_room_category: RoomsCategory;

  @Column({ nullable: false })
  age_limit: number;

  @Column({ nullable: false, default: '', type: 'text' })
  rule: string;

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];

  @ManyToMany(() => Users, (user) => user.favoriteRooms)
  @JoinTable({
    name: 'user_favorite_rooms',
    joinColumn: { name: 'room_id', referencedColumnName: 'room_id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'user_id' },
  })
  favorited_by: Users[];

  @ManyToOne(() => Users, (user) => user.createdRooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: Users;

  @OneToMany(() => RoomMember, (roomMember) => roomMember.room)
  roomMembers: RoomMember[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
