import { Expose } from 'class-transformer';

export class GetAuthDto {
  @Expose()
  username: string;

  @Expose()
  email: string;

  // jangan expose password kalau untuk frontend
  // @Expose()
  // password: string;
}
