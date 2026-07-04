import { PartialType } from '@nestjs/mapped-types';
import { CreatePresenceDto } from './create-presence.dto';
import { IsInt } from 'class-validator';

export class UpdatePresenceDto extends PartialType(CreatePresenceDto) {
  @IsInt()
  id: number;
}
