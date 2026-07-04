import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { GetProfileDto } from './dto/get-profile.dto';
import { Users } from 'src/users/entities/user.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileService: Repository<Profile>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}
  async createProfile(
    userId: number,
    createProfileDto: CreateProfileDto,
  ): Promise<{ message: string; data: GetProfileDto }> {
    const { profile_picture, bio } = createProfileDto;
    // check user dari repository user
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });
    if (!user)
      throw new NotFoundException(`User dengan id ${userId} tidak ada`);

    // buat profile
    const profile = this.profileService.create({
      profile_picture,
      bio,
      user,
    });
    const savedProfile = await this.profileService.save(profile);

    return {
      message: 'Data profile ditambahkan',
      data: plainToInstance(GetProfileDto, savedProfile, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async getProfile(): Promise<GetProfileDto[]> {
    const getProfiles = await this.profileService.find({
      relations: ['user'],
    });
    return plainToInstance(GetProfileDto, getProfiles, {
      excludeExtraneousValues: true,
    });
  }

  async getProfileById(id: number): Promise<GetProfileDto> {
    const getProfileById = await this.profileService.findOne({
      where: { profile_id: id },
      relations: ['user'],
    });
    if (!getProfileById) {
      throw new NotFoundException(`id ${id} kgk ada`);
    }
    return plainToInstance(GetProfileDto, getProfileById, {
      excludeExtraneousValues: true,
    });
  }

  async updateProfile(
    id: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<{ message: string; data: GetProfileDto }> {
    const profile = await this.profileService.findOne({
      where: { profile_id: id },
    });

    if (!profile)
      throw new NotFoundException(`Profile id ${id} tidak ditemukan`);

    Object.assign(profile, updateProfileDto);
    const saved = await this.profileService.save(profile);

    return {
      message: 'Profile berhasil diupdate',
      data: plainToInstance(GetProfileDto, saved, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.profileService.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Profile id ${id} tidak ditemukan`);
    return { message: 'Profile berhasil dihapus' };
  }

  async updateAvatar(userId: number, avatarUrl: string): Promise<Profile> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });
    if (!user) {
      throw new NotFoundException(`User dengan id ${userId} tidak ada`);
    }

    let profile = user.profile;
    if (!profile) {
      profile = this.profileService.create({
        profile_picture: avatarUrl,
        user,
      });
    } else {
      profile.profile_picture = avatarUrl;
    }

    return this.profileService.save(profile);
  }
}

