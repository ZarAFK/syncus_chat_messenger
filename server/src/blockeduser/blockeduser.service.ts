import { Injectable } from '@nestjs/common';
import { CreateBlockeduserDto } from './dto/create-blockeduser.dto';
import { UpdateBlockeduserDto } from './dto/update-blockeduser.dto';

@Injectable()
export class BlockeduserService {
  create(createBlockeduserDto: CreateBlockeduserDto) {
    return 'This action adds a new blockeduser';
  }

  findAll() {
    return `This action returns all blockeduser`;
  }

  findOne(id: number) {
    return `This action returns a #${id} blockeduser`;
  }

  update(id: number, updateBlockeduserDto: UpdateBlockeduserDto) {
    return `This action updates a #${id} blockeduser`;
  }

  remove(id: number) {
    return `This action removes a #${id} blockeduser`;
  }
}
