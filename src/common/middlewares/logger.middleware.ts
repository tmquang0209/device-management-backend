import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    res.on('finish', () => {
      const { statusCode } = res;
      Logger.log(
        `[${new Date().toISOString()}] ${method} ${originalUrl} - IP: ${ip} - Agent: ${userAgent} - Status: ${statusCode}`,
      );
    });

    next();
  }
}
