import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatar');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Patch('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `avatar_${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadAvatar(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const userId = req.user.userId ?? req.user.user_id ?? req.user.sub;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }
    const avatarUrl = `/uploads/avatar/${file.filename}`;
    const updatedProfile = await this.profileService.updateAvatar(userId, avatarUrl);
    return {
      success: true,
      message: 'Avatar updated successfully',
      avatar_url: avatarUrl,
      profile: updatedProfile,
    };
  }

  @Post()
  create(@Req() req, @Body() createProfileDto: CreateProfileDto) {
    const userId = req.user.userId ?? req.user.user_id;
    return this.profileService.createProfile(userId, createProfileDto);
  }

  @Get()
  findAll() {
    return this.profileService.getProfile();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profileService.getProfileById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(+id, updateProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileService.remove(+id);
  }
}

