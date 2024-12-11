import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SimpleMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const clientId = req.headers['x-client-id'];

    if (!clientId) {
      return res.status(400).json({ message: 'x-client-id header is required' });
    }

    console.log(`x-client-id: ${clientId}`);
    next(); // Tiếp tục chuyển request đến controller
  }
}
