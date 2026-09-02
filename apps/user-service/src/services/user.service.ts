import { AppError, getCache, setCache, invalidateCache, createLogger } from '@taskflow/shared';
import { UserRepository } from '../repositories/user.repository';

const logger = createLogger('user-service');
const CACHE_TTL = 600; // 10 minutes
const CACHE_PREFIX = 'user:';

export class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async getUserById(id: string) {
    // Check cache first
    const cacheKey = CACHE_PREFIX + id;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      logger.debug({ userId: id }, 'User fetched from cache');
      return cached;
    }

    // Cache miss â€” query database
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const sanitized = user.toJSON();
    await setCache(cacheKey, sanitized, CACHE_TTL);
    logger.debug({ userId: id }, 'User fetched from DB and cached');

    return sanitized;
  }

  async updateUser(requesterId: string, targetId: string, updates: { name?: string }) {
    // Users can only update their own profile
    if (requesterId !== targetId) {
      throw new AppError('You can only update your own profile.', 403);
    }

    const user = await this.userRepo.updateById(targetId, updates);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // Invalidate cache
    await invalidateCache(CACHE_PREFIX + targetId);
    logger.info({ userId: targetId }, 'User profile updated, cache invalidated');

    return user.toJSON();
  }

  async getMe(userId: string) {
    return this.getUserById(userId);
  }

  async listUsers(page: number, limit: number) {
    const { users, total } = await this.userRepo.findAll(page, limit);
    return {
      items: users.map((u) => u.toJSON()),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}