import { TaskModel, ITaskDocument } from '../models/task.model';
import { Types } from 'mongoose';
import { TaskStatus } from '@taskflow/shared';

export class TaskRepository {
  async create(data: {
    teamId: string;
    title: string;
    description?: string;
    assigneeId?: string;
    createdBy: string;
  }): Promise<ITaskDocument> {
    const task = new TaskModel({
      teamId: new Types.ObjectId(data.teamId),
      title: data.title,
      description: data.description || '',
      assigneeId: data.assigneeId ? new Types.ObjectId(data.assigneeId) : undefined,
      createdBy: new Types.ObjectId(data.createdBy),
    });
    return task.save();
  }

  async findById(id: string): Promise<ITaskDocument | null> {
    return TaskModel.findById(id).exec();
  }

  async updateById(
    id: string,
    updates: { title?: string; description?: string; status?: TaskStatus; assigneeId?: string }
  ): Promise<ITaskDocument | null> {
    const updateData: any = { ...updates };
    if (updates.assigneeId) {
      updateData.assigneeId = new Types.ObjectId(updates.assigneeId);
    }
    return TaskModel.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await TaskModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async findByTeamId(
    teamId: string,
    options: { page: number; limit: number; status?: TaskStatus }
  ): Promise<{ tasks: ITaskDocument[]; total: number }> {
    const filter: any = { teamId: new Types.ObjectId(teamId) };
    if (options.status) {
      filter.status = options.status;
    }

    const skip = (options.page - 1) * options.limit;
    const [tasks, total] = await Promise.all([
      TaskModel.find(filter).skip(skip).limit(options.limit).sort({ createdAt: -1 }).exec(),
      TaskModel.countDocuments(filter).exec(),
    ]);

    return { tasks, total };
  }

  async deleteByTeamId(teamId: string): Promise<number> {
    const result = await TaskModel.deleteMany({ teamId: new Types.ObjectId(teamId) }).exec();
    return result.deletedCount;
  }
}