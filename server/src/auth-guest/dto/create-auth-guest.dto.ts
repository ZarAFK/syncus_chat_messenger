import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';

export class CreateAuthGuestDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(18)
  @Max(64)
  age: number;

  @IsString()
  country: string;

  @IsIn(['male', 'female', 'other'])
  gender: string;
}
