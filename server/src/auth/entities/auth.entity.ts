import { Users } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('auth')
export class Auth {
  @PrimaryGeneratedColumn()
  auth_id: number;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false })
  hash_password: string;

  @Column({ nullable: true })
  refresh_token?: string;

  @Column({ nullable: true })
  reset_password_token?: string;

  @Column({ name: 'user_id' })
  user_id: number;

  @OneToOne(() => Users, (user) => user.auth, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
