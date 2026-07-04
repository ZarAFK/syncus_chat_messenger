import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAuthDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  hash_password?: string;

  // field lain yang sudah ada
  @IsOptional()
  @IsString()
  email?: string;
}
