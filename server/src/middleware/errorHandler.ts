import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // If it's the CORS error
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'Origin not allowed', code: 'cors_error' });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: err.message,
      code: err.code
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    code: 'internal_error'
  });
}
