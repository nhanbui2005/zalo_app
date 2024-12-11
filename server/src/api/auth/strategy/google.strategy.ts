import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID, // Lấy từ Google Console
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Lấy từ Google Console
      callbackURL: 'http://localhost:7777/api/v1/auth/google/callback', // URL callback
      scope: ['email', 'profile'], // Quyền truy cập cần thiết
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const user = {
      providerId:id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      imageUrl: photos[0].value,
      accessToken,
    };
    done(null, user); // Trả về thông tin user
  }
}
