import { UserModel, IUserDocument } from '../models/user.model';

export class UserRepository {
  async findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id).exec();
  }

  async updateById(
    id: string,
    updates: { name?: string; email?: string }
  ): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).exec();
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ users: IUserDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      UserModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      UserModel.countDocuments().exec(),
    ]);
    return { users, total };
  }
}