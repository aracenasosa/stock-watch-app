import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './types/jwt.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const domain = config.get<string>('AUTH0_DOMAIN');
    const audience = config.get<string>('AUTH0_AUDIENCE');
    const issuer = config.get<string>('AUTH0_ISSUER_URL');
    const jwksUri = config.get<string>('AUTH0_JWKS_URI');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience,
      issuer: issuer ?? `https://${domain}/`,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: jwksUri ?? `https://${domain}/.well-known/jwks.json`,
      }),
    });
  }

  validate(payload: Record<string, unknown>): JwtPayload {
    return {
      sub: payload.sub as string,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
    };
  }
}
