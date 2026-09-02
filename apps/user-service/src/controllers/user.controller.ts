import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

export class UserController {
  async getUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user!.userId;
    const updates = req.body;

    const user = await userService.updateUser(userId, id, updates);

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  }

  async getMe(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const user = await userService.getMe(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  }

  async listUsers(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await userService.listUsers(page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}