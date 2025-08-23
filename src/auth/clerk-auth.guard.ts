import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { Request } from 'express';
import { CLERK_URL } from 'src/constant';

export interface ReqObj extends Request {
  user?: { id: string };
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
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
