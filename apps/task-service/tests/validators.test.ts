import { describe, it, expect } from 'vitest';
import { createTaskSchema, updateTaskSchema } from '../src/validators/task.validators';

describe('Task Validators', () => {
  it('should validate task creation payload', () => {
    const validTask = {
      teamId: '507f1f77bcf86cd799439011',
      title: 'Implement Auth Flow',
      description: 'Add JWT verification',
    };
    const parsed = createTaskSchema.parse(validTask);
    expect(parsed.title).toBe('Implement Auth Flow');
  });

  it('should validate task status updates', () => {
    const validUpdate = { status: 'IN_PROGRESS' };
    const parsed = updateTaskSchema.parse(validUpdate);
    expect(parsed.status).toBe('IN_PROGRESS');
  });

  it('should reject invalid task status', () => {
    const invalidUpdate = { status: 'ARCHIVED' };
    expect(() => updateTaskSchema.parse(invalidUpdate)).toThrow();
  });
});
