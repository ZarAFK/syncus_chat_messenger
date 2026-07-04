import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { jwt_constants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auth]),
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ??
          jwt_constants.secret ??
          'defaultSecret',
        signOptions: { expiresIn: '4h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtModule, JwtStrategy, JwtAuthGuard],
})
export class AuthModule {}
