import { Module } from '@nestjs/common';
import { BlockeduserService } from './blockeduser.service';
import { BlockeduserController } from './blockeduser.controller';

@Module({
  controllers: [BlockeduserController],
  providers: [BlockeduserService],
})
export class BlockeduserModule {}
