import mongoose, { Schema, Document, Types } from 'mongoose';
import { ITeam, TeamMemberRole } from '@taskflow/shared';

export interface ITeamDocument extends Omit<ITeam, '_id'>, Document {}

const teamMemberSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER'],
      default: 'MEMBER',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const teamSchema = new Schema<ITeamDocument>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      minlength: [2, 'Team name must be at least 2 characters'],
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    members: {
      type: [teamMemberSchema],
      default: [],
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

// Indexes
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ name: 'text' });
teamSchema.index({ createdAt: -1 });

export const TeamModel = mongoose.model<ITeamDocument>('Team', teamSchema);