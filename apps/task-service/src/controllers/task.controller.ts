import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';

const taskService = new TaskService();

export class TaskController {
  async create(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const task = await taskService.createTask(userId, req.body);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { id } = req.params;

    const task = await taskService.getTask(id, userId);

    res.status(200).json({
      success: true,
      data: task,
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { id } = req.params;

    const task = await taskService.updateTask(id, userId, req.body);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task updated successfully',
    });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { id } = req.params;

    await taskService.deleteTask(id, userId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  }

  async getTeamTasks(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await taskService.getTeamTasks(id, userId, {
      page,
      limit,
      status: status as any,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}