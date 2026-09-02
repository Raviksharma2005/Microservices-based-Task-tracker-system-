import { Types } from 'mongoose';

// â”€â”€â”€ User Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: PlatformRole;
  createdAt: Date;
  updatedAt: Date;
}

export type PlatformRole = 'USER' | 'ADMIN';

export interface IUserPublic {
  _id: string;
  email: string;
  name: string;
  role: PlatformRole;
  createdAt: Date;
  updatedAt: Date;
}

// â”€â”€â”€ Team Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type TeamMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface ITeamMember {
  userId: Types.ObjectId;
  role: TeamMemberRole;
  joinedAt: Date;
}

export interface ITeam {
  _id: Types.ObjectId;
  name: string;
  description: string;
  members: ITeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

// â”€â”€â”€ Task Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface ITask {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// â”€â”€â”€ JWT Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface JwtPayload {
  userId: string;
  email: string;
  role: PlatformRole;
  type: 'access' | 'refresh';
}

// â”€â”€â”€ API Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// â”€â”€â”€ Express Extensions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}