import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roleguard.guard';
import { Roles } from 'src/auth/decorator/public.decorator';
import { notificationType } from './interface/notification.interface';

@Controller('notifications')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user', 'guest')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.notificationService.findAll(req.user.userId);
  }

  @Post('favorite')
  notifyFavorite(
    @Body() body: { targetUserId: number },
    @Req() req: any,
  ) {
    return this.notificationService.create(
      body.targetUserId,
      req.user.userId,
      notificationType.FAVORITE_ADD,
      req.user.userId,
      `@${req.user.username} menyukai/memfavoritkan Anda.`,
    );
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: number, @Req() req: any) {
    return this.notificationService.markAsRead(id, req.user.userId);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @Req() req: any) {
    return this.notificationService.remove(id, req.user.userId);
  }
}
