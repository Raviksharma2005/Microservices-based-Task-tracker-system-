import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../src/validators/auth.validators';

describe('Auth Validators', () => {
  it('should validate correct registration payload', () => {
    const input = {
      email: 'Ravi@Example.com',
      password: 'StrongPassword123',
      name: 'Ravi Sharma',
    };

    const parsed = registerSchema.parse(input);
    expect(parsed.email).toBe('ravi@example.com'); // normalized lowercase
    expect(parsed.name).toBe('Ravi Sharma');
  });

  it('should reject weak passwords without numbers or uppercase', () => {
    const input = {
      email: 'ravi@example.com',
      password: 'weakpassword',
      name: 'Ravi Sharma',
    };

    expect(() => registerSchema.parse(input)).toThrow();
  });

  it('should validate login payload', () => {
    const input = {
      email: 'ravi@example.com',
      password: 'SomePassword',
    };

    const parsed = loginSchema.parse(input);
    expect(parsed.email).toBe('ravi@example.com');
  });
});
