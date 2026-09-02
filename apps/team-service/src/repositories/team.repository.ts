import { TeamModel, ITeamDocument } from '../models/team.model';
import { TeamMemberRole } from '@taskflow/shared';
import { Types } from 'mongoose';

export class TeamRepository {
  async create(data: { name: string; description?: string; ownerId: string }): Promise<ITeamDocument> {
    const team = new TeamModel({
      name: data.name,
      description: data.description || '',
      members: [
        {
          userId: new Types.ObjectId(data.ownerId),
          role: 'OWNER' as TeamMemberRole,
          joinedAt: new Date(),
        },
      ],
    });
    return team.save();
  }

  async findById(id: string): Promise<ITeamDocument | null> {
    return TeamModel.findById(id).exec();
  }

  async updateById(id: string, updates: { name?: string; description?: string }): Promise<ITeamDocument | null> {
    return TeamModel.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await TeamModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async addMember(teamId: string, userId: string, role: TeamMemberRole): Promise<ITeamDocument | null> {
    return TeamModel.findByIdAndUpdate(
      teamId,
      {
        $push: {
          members: {
            userId: new Types.ObjectId(userId),
            role,
            joinedAt: new Date(),
          },
        },
      },
      { new: true }
    ).exec();
  }

  async removeMember(teamId: string, userId: string): Promise<ITeamDocument | null> {
    return TeamModel.findByIdAndUpdate(
      teamId,
      {
        $pull: {
          members: { userId: new Types.ObjectId(userId) },
        },
      },
      { new: true }
    ).exec();
  }

  async findTeamsByUserId(userId: string): Promise<ITeamDocument[]> {
    return TeamModel.find({ 'members.userId': new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getMemberRole(teamId: string, userId: string): Promise<TeamMemberRole | null> {
    const team = await TeamModel.findById(teamId).exec();
    if (!team) return null;
    const member = team.members.find((m) => m.userId.toString() === userId);
    return member?.role || null;
  }

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const team = await TeamModel.findOne({
      _id: teamId,
      'members.userId': new Types.ObjectId(userId),
    }).exec();
    return team !== null;
  }
}