import { Expose } from 'class-transformer';

export class GetProfileDto {
  @Expose()
  profile_id!: number;

  @Expose()
  profile_picture!: string;

  @Expose()
  bio!: string;

  @Expose()
  created_at!: Date;

  @Expose()
  updated_at!: Date;
}
