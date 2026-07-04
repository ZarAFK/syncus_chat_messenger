import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { countryEnum, genderEnum } from '../interface/users.interface';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'azhar_dev' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 23 })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({ enum: countryEnum })
  @IsOptional()
  @IsEnum(countryEnum)
  country?: countryEnum;

  @ApiPropertyOptional({ enum: genderEnum })
  @IsOptional()
  @IsEnum(genderEnum)
  gender?: genderEnum;

  @ApiPropertyOptional({ type: UpdateProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  profile?: UpdateProfileDto; // 👈 tambahkan ini
}
