import  {Request} from 'express';

export interface ReqObj extends Request {
  user?: { id: string };
}