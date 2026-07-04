import { Type, Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  ValidateNested,
  IsEnum,
} from 'class-validator';

import { countryEnum, genderEnum } from '../interface/users.interface';
import { CreateAuthDto } from 'src/auth/dto/create-auth.dto';

/**
 * Utility untuk map string/number ke enum target.
 * Menghindari bug "[object Object]" dengan cek tipe.
 */
const mapToEnum =
  <T extends Record<string, string | number>>(enumObj: T) =>
  ({ value }: { value: unknown }): T[keyof T] | undefined => {
    if (typeof value !== 'string' && typeof value !== 'number') {
      return undefined; // hanya izinkan string/number
    }

    const str = String(value).trim().toLowerCase();
    const entry = Object.values(enumObj).find(
      (v) => String(v).toLowerCase() === str,
    );

    return entry as T[keyof T] | undefined;
  };

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  age?: number;

  @IsNotEmpty()
  @Transform(mapToEnum(countryEnum), { toClassOnly: true })
  @IsEnum(countryEnum, { message: 'Invalid country' })
  country: countryEnum;

  @IsNotEmpty()
  @Transform(mapToEnum(genderEnum), { toClassOnly: true })
  @IsEnum(genderEnum, { message: 'Invalid gender' })
  gender: genderEnum;

  @ValidateNested()
  @Type(() => CreateAuthDto)
  auth: CreateAuthDto;
}
