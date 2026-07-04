import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { Users } from 'src/users/entities/user.entity';
import { Presence } from 'src/presence/entities/presence.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  username: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    loginAuthDto: LoginDto,
  ): Promise<{ access_token: string; user: any }> {
    const { email, password } = loginAuthDto;

    let auth = await this.authRepository.findOne({
      where: { email },
      relations: ['user'],
    });

    if (!auth) {
      // Fallback: look up user by username if email lookup fails
      const user = await this.authRepository.manager
        .getRepository(Users)
        .findOne({
          where: { username: email },
          relations: ['auth'],
        });
      if (user && user.auth) {
        auth = user.auth;
        auth.user = user;
      }
    }

    if (!auth || !auth.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, auth.hash_password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.authRepository.manager
      .getRepository(Users)
      .update(
        { user_id: auth.user.user_id },
        { is_online: true, last_seen: new Date() },
      );

    const payload: JwtPayload = {
      sub: auth.user.user_id,
      email: auth.email,
      role: auth.user.role,
      username: auth.user.username,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      user: {
        id: auth.user.user_id,
        username: auth.user.username,
        role: auth.user.role,
        email: auth.email,
      },
    };
  }

  async logout(user: JwtPayload): Promise<{ message: string }> {
    if (!user?.sub) {
      throw new UnauthorizedException('Invalid or missing user');
    }

    await this.authRepository.manager
      .getRepository(Users)
      .update(
        { user_id: user.sub },
        { is_online: false, last_seen: new Date() },
      );

    // Sync presence status to offline
    try {
      const presenceRepo = this.authRepository.manager.getRepository(Presence);
      const presence = await presenceRepo.findOne({
        where: { user: { user_id: user.sub } },
      });
      if (presence) {
        await presenceRepo.update(
          { presence_id: presence.presence_id },
          { is_online: false, last_seen: new Date() },
        );
      }
    } catch (err) {
      console.error('Failed to update presence status during logout:', err);
    }

    return { message: `User ${user.email} berhasil logout` };
  }

  async getLoginUser(): Promise<Auth[]> {
    const auths = await this.authRepository.find({ relations: ['user'] });
    return auths.map((a) => ({ ...a, hash_password: '***********' }));
  }

  async getLoginUserById(id: number): Promise<Auth> {
    const auth = await this.authRepository.findOne({
      where: { user: { user_id: id } },
      relations: ['user'],
    });

    if (!auth) throw new NotFoundException(`User with ID ${id} not found`);

    auth.hash_password = '***********';
    return auth;
  }

  async updateLoginUser(
    id: number,
    updateAuthDto: UpdateAuthDto,
  ): Promise<Auth> {
    const auth = await this.getLoginUserById(id);

    if (updateAuthDto.hash_password) {
      updateAuthDto.hash_password = await bcrypt.hash(
        updateAuthDto.hash_password,
        12,
      );
    }

    Object.assign(auth, updateAuthDto);
    const saved = await this.authRepository.save(auth);
    saved.hash_password = '***********';
    return saved;
  }

  async remove(id: number): Promise<Auth> {
    const auth = await this.getLoginUserById(id);
    await this.authRepository.remove(auth);
    return { ...auth, hash_password: '***********' };
  }

  async updatePassword(id: number, dto: UpdateAuthDto): Promise<Auth> {
    const auth = await this.getLoginUserById(id);
    auth.hash_password = await bcrypt.hash(dto.hash_password, 12);
    const saved = await this.authRepository.save(auth);
    saved.hash_password = '***********';
    return saved;
  }
}
