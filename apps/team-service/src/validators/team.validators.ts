import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional()
    .default(''),
});

export const updateTeamSchema = z.object({
  name: z
    .string()
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid user ID format'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export const teamIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid team ID format'),
});

export const memberParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid team ID format'),
  userId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid user ID format'),
});