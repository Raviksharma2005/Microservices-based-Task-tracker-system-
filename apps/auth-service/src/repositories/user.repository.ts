import { UserModel, IUserDocument } from '../models/user.model';

export class UserRepository {
  async findByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email }).select('+passwordHash').exec();
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id).exec();
  }

  async create(data: {
    email: string;
    passwordHash: string;
    name: string;
  }): Promise<IUserDocument> {
    const user = new UserModel(data);
    return user.save();
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email }).exec();
    return count > 0;
  }
}