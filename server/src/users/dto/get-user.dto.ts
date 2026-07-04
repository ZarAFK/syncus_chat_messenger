import { Expose, Type } from 'class-transformer';
import { GetAuthResponseDto } from 'src/users/dto/get-auth-responsedto.dto';
import { GetProfileDto } from 'src/profile/dto/get-profile.dto';

export class GetUserDto {
  @Expose()
  user_id: number;

  @Expose()
  username: string;

  @Expose()
  age?: number;

  @Expose()
  is_online: boolean;

  @Expose()
  last_seen: Date;

  @Expose()
  role: string;

  @Expose()
  country: string;

  @Expose()
  gender: string;

  @Expose()
  last_username_change?: Date;

  @Expose()
  created_at: Date;


  @Expose()
  updated_at: Date;

  // Nested Auth object
  @Expose()
  @Type(() => GetAuthResponseDto)
  auth: GetAuthResponseDto;

  // Nested Profile object (bisa null, jadi optional)
  @Expose()
  @Type(() => GetProfileDto)
  profile?: GetProfileDto;
}
