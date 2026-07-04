import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  email: string; // Accepts email or username

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
