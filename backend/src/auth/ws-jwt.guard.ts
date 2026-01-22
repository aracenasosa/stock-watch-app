import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly issuer =
    process.env.AUTH0_ISSUER_URL ?? `https://${process.env.AUTH0_DOMAIN}/`;
  private readonly jwksUri = new URL(
    '.well-known/jwks.json',
    this.issuer,
  ).toString();
  private readonly audience = process.env.AUTH0_AUDIENCE ?? '';

  private client = jwksClient({
    jwksUri: this.jwksUri,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();

    const token = this.getTokenFromUrl(client?.upgradeReq?.url);
    if (!token) throw new UnauthorizedException('Missing WS token');

    const headerJson = Buffer.from(token.split('.')[0], 'base64url').toString(
      'utf8',
    );
    const decodedHeader = JSON.parse(headerJson);

    const key = await this.client.getSigningKey(decodedHeader.kid);
    const signingKey = key.getPublicKey();

    try {
      const payload: any = verify(token, signingKey, {
        algorithms: ['RS256'],
        issuer: this.issuer,
        audience: this.audience,
      });

      client.user = { sub: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid WS token');
    }
  }

  private getTokenFromUrl(url?: string): string | null {
    if (!url) return null;
    const qs = url.split('?')[1];
    if (!qs) return null;
    const params = new URLSearchParams(qs);
    return params.get('token');
  }
}
