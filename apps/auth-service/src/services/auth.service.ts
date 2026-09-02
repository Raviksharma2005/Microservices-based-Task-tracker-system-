import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '@taskflow/shared';
import { getRedisClient } from '@taskflow/shared';
import { AppError } from '@taskflow/shared';
import { UserRepository } from '../repositories/user.repository';
import { IUserDocument } from '../models/user.model';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_PREFIX = 'refresh_token:';

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async register(email: string, password: string, name: string) {
    // Check if user already exists
    const exists = await this.userRepo.emailExists(email);
    if (exists) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await this.userRepo.create({ email, passwordHash, name });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token in Redis
    await this.storeRefreshToken(user._id.toString(), refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    // Find user with password field
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token in Redis
    await this.storeRefreshToken(user._id.toString(), refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new AppError('Server configuration error.', 500, false);

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(refreshToken, secret) as JwtPayload;
    } catch {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type.', 401);
    }

    // Verify refresh token exists in Redis (rotation check)
    const redis = getRedisClient();
    const storedToken = await redis.get(REFRESH_TOKEN_PREFIX + decoded.userId);
    if (!storedToken || storedToken !== refreshToken) {
      // Token reuse detected â€” invalidate all tokens for this user
      await redis.del(REFRESH_TOKEN_PREFIX + decoded.userId);
      throw new AppError('Refresh token has been revoked. Please log in again.', 401);
    }

    // Fetch fresh user data
    const user = await this.userRepo.findById(decoded.userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // Rotate refresh token
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);
    await this.storeRefreshToken(user._id.toString(), newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return this.sanitizeUser(user);
  }

  async logout(userId: string) {
    const redis = getRedisClient();
    await redis.del(REFRESH_TOKEN_PREFIX + userId);
  }

  // â”€â”€â”€ Private helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private generateAccessToken(user: IUserDocument): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError('Server configuration error.', 500, false);

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      type: 'access',
    };

    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
  }

  private generateRefreshToken(user: IUserDocument): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new AppError('Server configuration error.', 500, false);

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      type: 'refresh',
    };

    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const redis = getRedisClient();
    // Store with 7-day expiry
    await redis.setex(REFRESH_TOKEN_PREFIX + userId, 7 * 24 * 60 * 60, token);
  }

  private sanitizeUser(user: IUserDocument) {
    return {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}