import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginAuthDto: LoginDto) {
    const { access_token, user } = await this.authService.login(loginAuthDto);
    return {
      message: 'Login successful',
      access_token,
      user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request & { user?: any }) {
    return this.authService.logout(req.user);
  }

  @Get()
  async getLoginUser() {
    const users = await this.authService.getLoginUser();
    return {
      message: 'All auth users fetched successfully',
      data: users,
    };
  }

  @Get(':id')
  async getLoginUserById(@Param('id') id: string) {
    const auth = await this.authService.getLoginUserById(+id);
    return {
      message: `Auth user with ID ${id} fetched successfully`,
      data: auth,
    };
  }

  @Patch(':id')
  async updateLoginUser(
    @Param('id') id: string,
    @Body() updateAuthDto: UpdateAuthDto,
  ) {
    const updated = await this.authService.updateLoginUser(+id, updateAuthDto);
    return {
      message: `Auth user with ID ${id} updated successfully`,
      data: updated,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.authService.remove(+id);
    return {
      message: `Auth user with ID ${id} deleted successfully`,
      data: deleted,
    };
  }
}
