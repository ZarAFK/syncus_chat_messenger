import { PartialType } from '@nestjs/swagger';
import { CreateAuthGuestDto } from './create-auth-guest.dto';

export class UpdateAuthGuestDto extends PartialType(CreateAuthGuestDto) {}
