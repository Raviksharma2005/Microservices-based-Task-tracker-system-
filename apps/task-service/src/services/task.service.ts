import { AppError, getCache, setCache, invalidateCache, invalidateCachePattern, createLogger, TaskStatus } from '@taskflow/shared';
import { TaskRepository } from '../repositories/task.repository';
import mongoose from 'mongoose';

const logger = createLogger('task-service');
const CACHE_TTL = 300; // 5 minutes
const TASKS_CACHE_PREFIX = 'team_tasks:';

// Team membership check: we query the teams collection in the same MongoDB
// This avoids inter-service HTTP calls and keeps things simple
async function isTeamMember(teamId: string, userId: string): Promise<boolean> {
  const Team = mongoose.connection.collection('teams');
  const team = await Team.findOne({
    _id: new mongoose.Types.ObjectId(teamId),
    'members.userId': new mongoose.Types.ObjectId(userId),
  });
  return team !== null;
}

async function getTeamMemberRole(teamId: string, userId: string): Promise<string | null> {
  const Team = mongoose.connection.collection('teams');
  const team = await Team.findOne({
    _id: new mongoose.Types.ObjectId(teamId),
    'members.userId': new mongoose.Types.ObjectId(userId),
  });
  if (!team) return null;
  const member = (team.members as any[]).find(
    (m: any) => m.userId.toString() === userId
  );
  return member?.role || null;
}

export class TaskService {
  private taskRepo: TaskRepository;

  constructor() {
    this.taskRepo = new TaskRepository();
  }

  async createTask(userId: string, data: {
    teamId: string;
    title: string;
    description?: string;
    assigneeId?: string;
  }) {
    // Verify user is a member of the team
    const isMember = await isTeamMember(data.teamId, userId);
    if (!isMember) {
      throw new AppError('You are not a member of this team.', 403);
    }

    // If assignee is specified, verify they're also a team member
    if (data.assigneeId) {
      const assigneeIsMember = await isTeamMember(data.teamId, data.assigneeId);
      if (!assigneeIsMember) {
        throw new AppError('Assignee is not a member of this team.', 400);
      }
    }

    const task = await this.taskRepo.create({
      ...data,
      createdBy: userId,
    });

    // Invalidate team tasks cache
    await invalidateCachePattern(TASKS_CACHE_PREFIX + data.teamId + ':*');
    logger.info({ taskId: task._id, teamId: data.teamId, userId }, 'Task created');
    return task.toJSON();
  }

  async getTask(taskId: string, userId: string) {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    // Verify user is a member of the task's team
    const isMember = await isTeamMember(task.teamId.toString(), userId);
    if (!isMember) {
      throw new AppError('You are not a member of this team.', 403);
    }

    return task.toJSON();
  }

  async updateTask(taskId: string, userId: string, updates: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    assigneeId?: string;
  }) {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    // Authorization: assignee, creator, or team admin/owner can update
    await this.requireTaskPermission(task, userId);

    // If re-assigning, verify new assignee is team member
    if (updates.assigneeId) {
      const assigneeIsMember = await isTeamMember(task.teamId.toString(), updates.assigneeId);
      if (!assigneeIsMember) {
        throw new AppError('Assignee is not a member of this team.', 400);
      }
    }

    const updated = await this.taskRepo.updateById(taskId, updates);
    if (!updated) {
      throw new AppError('Failed to update task.', 500);
    }

    await invalidateCachePattern(TASKS_CACHE_PREFIX + task.teamId.toString() + ':*');
    logger.info({ taskId, userId }, 'Task updated');
    return updated.toJSON();
  }

  async deleteTask(taskId: string, userId: string) {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    await this.requireTaskPermission(task, userId);

    const deleted = await this.taskRepo.deleteById(taskId);
    if (!deleted) {
      throw new AppError('Failed to delete task.', 500);
    }

    await invalidateCachePattern(TASKS_CACHE_PREFIX + task.teamId.toString() + ':*');
    logger.info({ taskId, teamId: task.teamId, userId }, 'Task deleted');
  }

  async getTeamTasks(teamId: string, userId: string, options: {
    page: number;
    limit: number;
    status?: TaskStatus;
  }) {
    // Verify membership
    const isMember = await isTeamMember(teamId, userId);
    if (!isMember) {
      throw new AppError('You are not a member of this team.', 403);
    }

    // Check cache
    const cacheKey = TASKS_CACHE_PREFIX + teamId + ':p' + options.page + ':l' + options.limit + (options.status ? ':s' + options.status : '');
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const { tasks, total } = await this.taskRepo.findByTeamId(teamId, options);
    const result = {
      items: tasks.map((t) => t.toJSON()),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  }

  // â”€â”€â”€ Private helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private async requireTaskPermission(task: any, userId: string) {
    const isCreator = task.createdBy.toString() === userId;
    const isAssignee = task.assigneeId?.toString() === userId;

    if (isCreator || isAssignee) return;

    // Check if user is team admin/owner
    const role = await getTeamMemberRole(task.teamId.toString(), userId);
    if (!role) {
      throw new AppError('You are not a member of this team.', 403);
    }
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new AppError('Only the task creator, assignee, or team admin/owner can perform this action.', 403);
    }
  }
}