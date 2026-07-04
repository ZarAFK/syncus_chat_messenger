import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BlockeduserService } from './blockeduser.service';
import { CreateBlockeduserDto } from './dto/create-blockeduser.dto';
import { UpdateBlockeduserDto } from './dto/update-blockeduser.dto';

@Controller('blockeduser')
export class BlockeduserController {
  constructor(private readonly blockeduserService: BlockeduserService) {}

  @Post()
  create(@Body() createBlockeduserDto: CreateBlockeduserDto) {
    return this.blockeduserService.create(createBlockeduserDto);
  }

  @Get()
  findAll() {
    return this.blockeduserService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blockeduserService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBlockeduserDto: UpdateBlockeduserDto,
  ) {
    return this.blockeduserService.update(+id, updateBlockeduserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blockeduserService.remove(+id);
  }
}
