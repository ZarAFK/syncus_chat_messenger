import { PartialType } from '@nestjs/swagger';
import { CreateBlockeduserDto } from './create-blockeduser.dto';

export class UpdateBlockeduserDto extends PartialType(CreateBlockeduserDto) {}
