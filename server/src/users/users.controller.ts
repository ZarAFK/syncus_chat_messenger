import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Req,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

type JwtPayloadLite = {
  userId: number;
  username?: string;
  email?: string;
  role?: string;
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 🔹 REGISTER USER
  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    const created = await this.usersService.register(createUserDto);
    return {
      message: 'User registered successfully',
      data: created,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile_user')
  async getProfileUser(@Req() req: Request & { user?: any }): Promise<{
    message: string;
    data: { user: GetUserDto; tokenPayload: any };
  }> {
    try {
      const raw = req.user;
      console.log('decoded jwt', raw);

      const userId =
        raw?.userId ??
        raw?.user_id ??
        raw?.id ??
        raw?.sub ??
        (raw?.user && (raw.user.id ?? raw.user.user_id));

      if (!userId) {
        throw new UnauthorizedException(
          'Token invalid atau user tidak ditemukan',
        );
      }

      console.log('userId yg dipakai:', userId);
      console.log('headers', req.headers);

      const result = await this.usersService.getProfile(Number(userId));

      return {
        message: 'sukses ngefetch data user',
        data: {
          user: result.data,
          tokenPayload: raw,
        },
      };
    } catch (error) {
      console.error('Error di getProfileUser:', error);
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Gagal mengambil data profil user: ' +
          (error?.message ?? String(error)),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getBasicProfile(@Req() req: Request & { user: JwtPayloadLite }): {
    message: string;
    data: Partial<GetUserDto>;
  } {
    const { userId, username, email, role } = req.user;
    return {
      message: 'Profile user (from token payload)',
      data: { user_id: userId, username, auth: { email: email || '' }, role },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(): Promise<{ message: string; data: GetUserDto[] }> {
    const users = await this.usersService.getUser();
    return {
      message: 'All users fetched successfully',
      data: users,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; data: GetUserDto }> {
    const user = await this.usersService.getUserById(id);
    return {
      message: `User with ID ${id} fetched successfully`,
      data: user,
    };
  }

  // 🔹 UPDATE USER
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<{ message: string; data: GetUserDto }> {
    const updatedUser = await this.usersService.updateUser(id, updateUserDto);
    return {
      message: `User with ID ${id} updated successfully`,
      data: updatedUser,
    };
  }

  // 🔹 DELETE USER
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; data: GetUserDto }> {
    const deletedUser = await this.usersService.remove(id);
    return {
      message: `User with ID ${id} deleted successfully`,
      data: deletedUser,
    };
  }
}
