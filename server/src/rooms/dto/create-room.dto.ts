import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  room_name: string;

  @IsString()
  @IsOptional()
  room_description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(100)
  age_limit: number;

  @IsString()
  @IsOptional()
  rule?: string;

  @IsString()
  @IsOptional()
  room_picture?: string;

  @IsNumber()
  @IsNotEmpty()
  category_room_id: number;

  // creator_id opsional:
  // jika mau ambil otomatis dari user login, jangan dimasukkan ke DTO.
  // kalau tetap ingin lewat body request, tambahkan:
  @IsNumber()
  @IsOptional()
  creator_id?: number;
}
