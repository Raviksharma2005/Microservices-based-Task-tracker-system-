import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware, requireRole } from '../src/middleware/auth';
import { Request, Response, NextFunction } from 'express';

describe('Auth Middleware', () => {
  const secret = 'test-jwt-secret-for-testing';
  process.env.JWT_SECRET = secret;

  it('should reject request without Authorization header', () => {
    const req = { headers: {} } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject invalid Bearer token', () => {
    const req = { headers: { authorization: 'Bearer invalid-token-value' } } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach user payload on valid access token', () => {
    const payload = { userId: '123456789012345678901234', email: 'test@example.com', role: 'USER', type: 'access' };
    const token = jwt.sign(payload, secret, { expiresIn: '15m' });

    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe(payload.userId);
    expect(next).toHaveBeenCalled();
  });
});

describe('Role Authorization Middleware', () => {
  it('should allow access when user has required role', () => {
    const req = { user: { userId: '1', email: 'a@a.com', role: 'ADMIN', type: 'access' } } as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireRole('ADMIN')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should forbid access when user lacks required role', () => {
    const req = { user: { userId: '1', email: 'a@a.com', role: 'USER', type: 'access' } } as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireRole('ADMIN')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
