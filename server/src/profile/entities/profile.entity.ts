import { Users } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_profile')
export class Profile {
  @PrimaryGeneratedColumn()
  profile_id: number;

  @Column({ nullable: true })
  profile_picture?: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => Users, (user) => user.profile, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
