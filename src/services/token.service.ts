import { UserEntity } from '@entities';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateAccessToken(user: UserEntity) {
    const payload = {
      sub: user.id,
      iss: process.env.JWT_ISSUER ?? '',
      aud: process.env.JWT_AUDIENCE ?? '',
      email: user.email,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });
  }

  async generateRefreshToken(user: UserEntity) {
    const payload = {
      sub: user.id,
      iss: process.env.JWT_ISSUER ?? '',
      aud: process.env.JWT_AUDIENCE ?? '',
      id: user.id,
    };

    console.log('🔧 TokenService ~ generateRefreshToken ~ payload:', payload);
    console.log(
      '🔧 TokenService ~ generateRefreshToken ~ secret:',
      this.configService.get('JWT_REFRESH_SECRET'),
    );

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });
  }
}
