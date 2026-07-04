import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuestController } from './auth-guest.controller';
import { AuthGuestService } from './auth-guest.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthGuestController],
  providers: [AuthGuestService],
})
export class AuthGuestModule {}
