import { plainToInstance } from 'class-transformer';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';
import { GetUserDto } from './dto/get-user.dto';
import * as bcrypt from 'bcrypt';
import { Auth } from 'src/auth/entities/auth.entity';
import { Role } from './enum/role_user';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,

    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<GetUserDto> {
    const { auth: authDto, ...userData } = createUserDto;

    const existingAuth = await this.authRepository.findOne({
      where: { email: authDto.email },
    });
    if (existingAuth) throw new ConflictException('Email already exists');

    const existingUsername = await this.usersRepository.findOneBy({
      username: userData.username,
    });
    if (existingUsername)
      throw new ConflictException('Username already exists');

    const userCount = await this.usersRepository.count();
    const userRole: Role = userCount === 0 ? Role.ADMIN : Role.USER;

    const hashpswd = await bcrypt.hash(authDto.password, 12);

    const auth = this.authRepository.create({
      email: authDto.email,
      hash_password: hashpswd,
    });

    const user = this.usersRepository.create({
      ...userData,
      role: userRole,
      auth,
    });

    const savedUser = await this.usersRepository.save(user);

    return plainToInstance(GetUserDto, savedUser, {
      excludeExtraneousValues: true,
    });
  }
  async getUser(): Promise<GetUserDto[]> {
    const users = await this.usersRepository.find({
      relations: ['auth', 'profile'],
    });

    return plainToInstance(GetUserDto, users, {
      excludeExtraneousValues: true,
    });
  }

  async getUserById(id: number): Promise<GetUserDto> {
    const user = await this.usersRepository.findOne({
      where: { user_id: id },
      relations: ['auth', 'profile'],
    });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    return plainToInstance(GetUserDto, user, {
      excludeExtraneousValues: true,
    });
  }
  async getProfile(userId: number) {
    try {
      console.log(' getProfile() start, userId:', userId);

      const user = await this.usersRepository.findOne({
        where: { user_id: userId },
        relations: ['auth', 'profile'],
      });

      console.log(' Query result:', user);

      if (!user) {
        console.warn(' User tidak ditemukan untuk ID:', userId);
        throw new UnauthorizedException('User not found or token invalid');
      }

      const safeUser = {
        ...user,
        profile: user.profile ?? { bio: '', avatar_url: '' },
        auth: user.auth ?? { email: '' },
      };

      const data = plainToInstance(GetUserDto, safeUser, {
        excludeExtraneousValues: true,
      });

      console.log(' Profile berhasil dikonversi DTO:', data);

      return { message: 'Profile user', data };
    } catch (error) {
      console.error(' Error detail di getProfile():', error);
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Terjadi kesalahan saat ambil profil user: ' +
          (error?.message ?? String(error)),
      );
    }
  }

  // 🔹 UPDATE USER
  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<GetUserDto> {
    const user = await this.usersRepository.findOne({
      where: { user_id: id },
      relations: ['auth', 'profile'],
    });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // Username uniqueness check
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      // Cooldown check: 30 days
      const cooldownMs = 30 * 24 * 60 * 60 * 1000;
      if (user.last_username_change) {
        const timePassed = Date.now() - new Date(user.last_username_change).getTime();
        if (timePassed < cooldownMs) {
          const daysLeft = Math.ceil((cooldownMs - timePassed) / (24 * 60 * 60 * 1000));
          throw new BadRequestException(
            `Username hanya dapat diubah sekali setiap 30 hari. Silakan coba lagi dalam ${daysLeft} hari.`
          );
        }
      }

      const existing = await this.usersRepository.findOneBy({
        username: updateUserDto.username,
      });
      if (existing && existing.user_id !== id) {
        throw new ConflictException('Username already exists');
      }
      user.username = updateUserDto.username;
      user.last_username_change = new Date();
    }

    if (updateUserDto.age !== undefined) user.age = updateUserDto.age;
    if (updateUserDto.country !== undefined)
      user.country = updateUserDto.country as any;
    if (updateUserDto.gender !== undefined)
      user.gender = updateUserDto.gender as any;

    // Profile nested update
    if (updateUserDto.profile) {
      if (!user.profile) {
        user.profile = this.usersRepository.manager.create('Profile');
      }
      if (updateUserDto.profile.bio !== undefined)
        user.profile.bio = updateUserDto.profile.bio;
      if (updateUserDto.profile.profile_picture !== undefined)
        user.profile.profile_picture = updateUserDto.profile.profile_picture;
    }

    const savedUser = await this.usersRepository.save(user);

    return plainToInstance(GetUserDto, savedUser, {
      excludeExtraneousValues: true,
    });
  }

  // 🔹 DELETE USER
  async remove(id: number): Promise<GetUserDto> {
    const user = await this.usersRepository.findOne({
      where: { user_id: id },
      relations: ['auth', 'profile'],
    });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    await this.usersRepository.remove(user);

    return plainToInstance(GetUserDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
