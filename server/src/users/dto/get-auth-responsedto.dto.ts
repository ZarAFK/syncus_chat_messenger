import { Expose } from 'class-transformer';

export class GetAuthResponseDto {
  @Expose()
  email?: string;
}
