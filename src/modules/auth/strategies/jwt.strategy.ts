import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { AuthenticatedUser } from '../../../common/auth/interfaces/authenticated-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

function extractJwtFromCookie(request: Request): string | null {
  // === extract jwt from cookie ===
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.trim().split('=');

    if (rawName === 'accessToken') {
      return rawValueParts.join('=') || null;
    }
  }

  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // === support bearer token and cookie auth ===
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractJwtFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // === map jwt payload to request user ===
  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  }
}
