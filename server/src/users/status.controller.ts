import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Request } from 'express';
import { StatusService } from './status.service';

@UseGuards(JwtAuthGuard)
@Controller('users/status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post()
  async create(
    @Req() req: Request & { user: any },
    @Body() body: { text?: string; emoji?: string; images?: string[] },
  ) {
    const userId = req.user.userId || req.user.user_id || req.user.id || req.user.sub;
    return this.statusService.createStatus(
      Number(userId),
      body.text,
      body.emoji,
      body.images,
    );
  }

  @Get('friends')
  async getFriends(@Req() req: Request & { user: any }) {
    const userId = req.user.userId || req.user.user_id || req.user.id || req.user.sub;
    return this.statusService.getFriendStatuses(Number(userId));
  }

  @Get('me')
  async getMyStatuses(@Req() req: Request & { user: any }) {
    const userId = req.user.userId || req.user.user_id || req.user.id || req.user.sub;
    return this.statusService.getMyStatuses(Number(userId));
  }

  @Post(':id/view')
  async view(
    @Req() req: Request & { user: any },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.userId || req.user.user_id || req.user.id || req.user.sub;
    return this.statusService.viewStatus(Number(userId), id);
  }

  @Delete(':id')
  async delete(
    @Req() req: Request & { user: any },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.userId || req.user.user_id || req.user.id || req.user.sub;
    return this.statusService.deleteStatus(Number(userId), id);
  }

  @Post(':id/comments')
  async addComment(
    @Req() req: Request & { user: any },
    @Param('id', ParseIntPipe) statusId: number,
    @Body() body: { text: string },
  ) {
    const userId = req.user.userId || req.user.user_id || req.user.id || req.user.sub;
    return this.statusService.addComment(Number(userId), statusId, body.text);
  }

  @Delete('comments/:commentId')
  async deleteComment(
    @Req() req: Request & { user: any },
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    const userId = req.user.userId || req.user.user_id || req.user.id || req.user.sub;
    return this.statusService.deleteComment(Number(userId), commentId);
  }
}
