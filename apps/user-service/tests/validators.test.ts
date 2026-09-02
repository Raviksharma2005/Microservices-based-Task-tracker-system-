import { describe, it, expect } from 'vitest';
import { updateUserSchema, userIdParamSchema } from '../src/validators/user.validators';

describe('User Validators', () => {
  it('should validate valid user update', () => {
    const data = { name: 'Updated Name' };
    const parsed = updateUserSchema.parse(data);
    expect(parsed.name).toBe('Updated Name');
  });

  it('should validate MongoDB ObjectId in params', () => {
    const validParams = { id: '507f1f77bcf86cd799439011' };
    expect(() => userIdParamSchema.parse(validParams)).not.toThrow();

    const invalidParams = { id: 'not-an-id' };
    expect(() => userIdParamSchema.parse(invalidParams)).toThrow();
  });
});
