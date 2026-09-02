import { describe, it, expect } from 'vitest';
import { createTeamSchema, addMemberSchema, teamIdParamSchema } from '../src/validators/team.validators';

describe('Team Validators', () => {
  it('should validate team creation payload', () => {
    const validTeam = { name: 'Engineering Team', description: 'Core Platform' };
    const parsed = createTeamSchema.parse(validTeam);
    expect(parsed.name).toBe('Engineering Team');
  });

  it('should reject invalid team name', () => {
    const invalidTeam = { name: 'A' }; // Too short (min 2)
    expect(() => createTeamSchema.parse(invalidTeam)).toThrow();
  });

  it('should validate add member payload', () => {
    const validMember = { userId: '507f1f77bcf86cd799439011', role: 'ADMIN' };
    const parsed = addMemberSchema.parse(validMember);
    expect(parsed.role).toBe('ADMIN');
  });

  it('should reject invalid member role', () => {
    const invalidMember = { userId: '507f1f77bcf86cd799439011', role: 'SUPERUSER' };
    expect(() => addMemberSchema.parse(invalidMember)).toThrow();
  });
});
