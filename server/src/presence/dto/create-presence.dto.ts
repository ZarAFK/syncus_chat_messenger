import { IsBoolean, IsDate, IsInt, IsOptional } from 'class-validator';

export class CreatePresenceDto {
  @IsInt()
  user_id: number;

  @IsOptional()
  @IsInt()
  room_id?: number;

  @IsOptional()
  @IsBoolean()
  is_online?: boolean;

  @IsOptional()
  @IsDate()
  last_seen?: Date;
}
