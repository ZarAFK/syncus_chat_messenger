import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { CreateAuthGuestDto } from './dto/create-auth-guest.dto';

@Injectable()
export class AuthGuestService {
  constructor(private readonly jwtService: JwtService) {}

  async createGuest(dto: CreateAuthGuestDto) {
    const guestId = uuidv4();

    // payload untuk JWT
    const payload = {
      sub: guestId,
      role: 'guest',
      ...dto,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '1d' });

    return {
      guestId,
      token,
      expiresIn: 86400,
      profile: dto,
    };
  }
}
