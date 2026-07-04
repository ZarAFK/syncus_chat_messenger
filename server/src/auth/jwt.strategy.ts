import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwt_constants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || jwt_constants.secret,
    });
  }

  validate(payload: any) {
    console.log('payload jwy', payload);

    return {
      userId: payload.sub ?? payload.id,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };
  }
}
