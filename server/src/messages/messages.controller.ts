import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorator/public.decorator';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roleguard.guard';

@Controller('chat')
export class MessagesController {
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('user', 'guest')
  @Get()
  getChat(@Req() req) {
    return { message: 'Chat room', user: req.user };
  }
}
