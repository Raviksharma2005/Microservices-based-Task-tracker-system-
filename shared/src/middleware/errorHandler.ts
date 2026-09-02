import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('error-handler');

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn(
      {
        statusCode: err.statusCode,
        message: err.message,
        path: req.path,
        method: req.method,
      },
      'Operational error'
    );

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.message,
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry. This resource already exists.',
    });
    return;
  }

  // Unexpected errors — never leak stack trace in production
  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
      stack: err.stack,
    },
    'Unexpected error'
  );

  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred. Please try again later.',
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
