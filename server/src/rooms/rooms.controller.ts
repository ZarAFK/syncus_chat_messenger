import {
  Controller,
  Patch,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Request } from 'express';
import { RoomsGateway } from './rooms.gateway';

const uploadDir = join(process.cwd(), 'public', 'uploads', 'rooms');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly roomsGateway: RoomsGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':id/picture')
  @UseInterceptors(
    FileInterceptor('picture', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `room_${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async updatePicture(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: any },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const pictureUrl = `/uploads/rooms/${file.filename}`;

    // Update DB
    const updatedRoom = await this.roomsService.updateRoomPicture(id, pictureUrl);

    // Broadcast to all sockets so everyone sees the change in real time
    this.roomsGateway.server.emit('roomUpdated', updatedRoom);

    return { success: true, room_picture: pictureUrl, room: updatedRoom };
  }
}
