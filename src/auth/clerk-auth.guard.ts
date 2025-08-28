import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { ReqObj } from 'src/common/types';
import { CLERK_URL } from 'src/constant';
import { ConfigService } from '@nestjs/config';

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
      const response = await axios.get(CLERK_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Clerk-Secret-Key': this.configService.get<string>('CLERK_SECRET_KEY')
        }
      });

      const user = response.data;
      req.user = { id: user.id };
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
