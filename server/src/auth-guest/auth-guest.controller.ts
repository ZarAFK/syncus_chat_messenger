import { Body, Controller, Post } from '@nestjs/common';
import { AuthGuestService } from './auth-guest.service';
import { CreateAuthGuestDto } from './dto/create-auth-guest.dto';

@Controller('auth/guest')
export class AuthGuestController {
  constructor(private readonly authGuestService: AuthGuestService) {}

  @Post('login')
  async loginAsGuest(@Body() dto: CreateAuthGuestDto) {
    return this.authGuestService.createGuest(dto);
  }
}
