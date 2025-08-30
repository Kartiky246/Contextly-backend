import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ReqObj } from 'src/common/types';
import { CLERK_URL } from 'src/constant';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';


@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private configService: ConfigService){}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: ReqObj = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Invalid authorization header format');

    try {
      const verifiedToken = await verifyToken(token, {
        jwtKey: this.configService.get<string>('CLERK_JWT_KEY'),
        authorizedParties:[
          'http://localhost:5173'

        ],
        secretKey: process.env.CLERK_SECRET_KEY 
      });
      req.user = {
        id: verifiedToken.sub,
      }
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
