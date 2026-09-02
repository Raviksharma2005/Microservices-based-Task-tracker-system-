import { AppError, getCache, setCache, invalidateCache, createLogger, TeamMemberRole } from '@taskflow/shared';
import { TeamRepository } from '../repositories/team.repository';

const logger = createLogger('team-service');
const CACHE_TTL = 600;
const CACHE_PREFIX = 'team:';

export class TeamService {
  private teamRepo: TeamRepository;

  constructor() {
    this.teamRepo = new TeamRepository();
  }

  async createTeam(userId: string, name: string, description?: string) {
    const team = await this.teamRepo.create({ name, description, ownerId: userId });
    logger.info({ teamId: team._id, userId }, 'Team created');
    return team.toJSON();
  }

  async getTeam(teamId: string, userId: string) {
    const cacheKey = CACHE_PREFIX + teamId;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      const isMember = cached.members?.some((m: any) => m.userId.toString() === userId);
      if (!isMember) {
        throw new AppError('You are not a member of this team.', 403);
      }
      return cached;
    }

    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new AppError('Team not found.', 404);
    }

    const isMember = team.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('You are not a member of this team.', 403);
    }

    const teamJson = team.toJSON();
    await setCache(cacheKey, teamJson, CACHE_TTL);
    return teamJson;
  }

  async updateTeam(teamId: string, userId: string, updates: { name?: string; description?: string }) {
    await this.requireRole(teamId, userId, ['OWNER', 'ADMIN']);

    const team = await this.teamRepo.updateById(teamId, updates);
    if (!team) {
      throw new AppError('Team not found.', 404);
    }

    await invalidateCache(CACHE_PREFIX + teamId);
    logger.info({ teamId, userId }, 'Team updated');
    return team.toJSON();
  }

  async deleteTeam(teamId: string, userId: string) {
    await this.requireRole(teamId, userId, ['OWNER']);

    const deleted = await this.teamRepo.deleteById(teamId);
    if (!deleted) {
      throw new AppError('Team not found.', 404);
    }

    await invalidateCache(CACHE_PREFIX + teamId);
    logger.info({ teamId, userId }, 'Team deleted');
  }

  async addMember(teamId: string, requesterId: string, newMemberId: string, role: TeamMemberRole = 'MEMBER') {
    await this.requireRole(teamId, requesterId, ['OWNER', 'ADMIN']);

    if (role === 'OWNER') {
      throw new AppError('Cannot assign OWNER role. Transfer ownership instead.', 400);
    }

    const isMember = await this.teamRepo.isMember(teamId, newMemberId);
    if (isMember) {
      throw new AppError('User is already a member of this team.', 409);
    }

    const team = await this.teamRepo.addMember(teamId, newMemberId, role);
    if (!team) {
      throw new AppError('Team not found.', 404);
    }

    await invalidateCache(CACHE_PREFIX + teamId);
    logger.info({ teamId, newMemberId, role, addedBy: requesterId }, 'Member added to team');
    return team.toJSON();
  }

  async removeMember(teamId: string, requesterId: string, targetUserId: string) {
    await this.requireRole(teamId, requesterId, ['OWNER']);

    if (requesterId === targetUserId) {
      throw new AppError('Owner cannot remove themselves. Transfer ownership first.', 400);
    }

    const team = await this.teamRepo.removeMember(teamId, targetUserId);
    if (!team) {
      throw new AppError('Team not found.', 404);
    }

    await invalidateCache(CACHE_PREFIX + teamId);
    logger.info({ teamId, targetUserId, removedBy: requesterId }, 'Member removed from team');
    return team.toJSON();
  }

  async getMembers(teamId: string, userId: string) {
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new AppError('Team not found.', 404);
    }

    const isMember = team.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('You are not a member of this team.', 403);
    }

    return team.members;
  }

  async getMyTeams(userId: string) {
    const teams = await this.teamRepo.findTeamsByUserId(userId);
    return teams.map((t) => t.toJSON());
  }

  private async requireRole(teamId: string, userId: string, allowedRoles: TeamMemberRole[]) {
    const role = await this.teamRepo.getMemberRole(teamId, userId);
    if (!role) {
      throw new AppError('You are not a member of this team.', 403);
    }
    if (!allowedRoles.includes(role)) {
      throw new AppError(`This action requires one of: ${allowedRoles.join(', ')} role.`, 403);
    }
  }
}
