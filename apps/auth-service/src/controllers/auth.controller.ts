import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { createLogger } from '@taskflow/shared';

const logger = createLogger('auth-controller');
const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const { email, password, name } = req.body;
    logger.info({ email }, 'Registration attempt');

    const result = await authService.register(email, password, name);

    logger.info({ userId: result.user._id }, 'User registered successfully');
    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful',
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    logger.info({ email }, 'Login attempt');

    const result = await authService.login(email, password);

    logger.info({ userId: result.user._id }, 'Login successful');
    res.status(200).json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Token refreshed successfully',
    });
  }

  async me(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const user = await authService.getMe(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    await authService.logout(userId);

    logger.info({ userId }, 'User logged out');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}