import { z } from 'zod';

export const createTaskSchema = z.object({
  teamId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid team ID format'),
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional()
    .default(''),
  assigneeId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid assignee ID format')
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  assigneeId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid assignee ID format')
    .optional(),
});

export const taskIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid task ID format'),
});

export const teamTasksParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid team ID format'),
});

export const teamTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
});