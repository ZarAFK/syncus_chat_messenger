import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import {
  countryEnum,
  genderEnum,
  UserStatus,
} from '../interface/users.interface';
import { Profile } from 'src/profile/entities/profile.entity';
import { Auth } from 'src/auth/entities/auth.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Message } from 'src/messages/entities/message.entity';
import { RoomMember } from 'src/room_members/entities/room_member.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { Role } from '../enum/role_user';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ nullable: false, unique: true })
  username: string;

  @Column({ nullable: true })
  age?: number;

  @Column({ type: 'boolean', default: false })
  is_online: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_seen: Date;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ nullable: false, type: 'enum', enum: countryEnum })
  country: countryEnum;

  @Column({ nullable: false, type: 'enum', enum: genderEnum })
  gender: genderEnum;

  @OneToOne(() => Auth, (auth) => auth.user, { cascade: true, eager: true })
  auth: Auth;

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  profile: Profile;

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => RoomMember, (roomMember) => roomMember.user)
  roomMembers: RoomMember[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @ManyToMany(() => Room, (room) => room.favorited_by)
  @JoinTable({
    name: 'user_favorite_rooms',
    joinColumn: { name: 'user_id', referencedColumnName: 'user_id' },
    inverseJoinColumn: { name: 'room_id', referencedColumnName: 'room_id' },
  })
  favoriteRooms: Room[];

  // rooms yang dibuat user
  @OneToMany(() => Room, (room) => room.creator)
  createdRooms: Room[];

  @Column({ type: 'timestamp', nullable: true })
  last_username_change?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true, type: 'timestamp' })
  last_login?: Date;
}

