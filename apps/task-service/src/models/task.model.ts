import mongoose, { Schema, Document } from 'mongoose';
import { ITask } from '@taskflow/shared';

export interface ITaskDocument extends Omit<ITask, '_id'>, Document {}

const taskSchema = new Schema<ITaskDocument>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Team ID is required'],
      ref: 'Team',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'DONE'],
      default: 'TODO',
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for common queries
taskSchema.index({ teamId: 1, status: 1 });
taskSchema.index({ teamId: 1, assigneeId: 1 });
taskSchema.index({ teamId: 1, createdAt: -1 });

export const TaskModel = mongoose.model<ITaskDocument>('Task', taskSchema);