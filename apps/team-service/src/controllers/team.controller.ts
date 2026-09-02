import { Request, Response } from 'express';
import { TeamService } from '../services/team.service';

const teamService = new TeamService();

export class TeamController {
  async create(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { name, description } = req.body;

    const team = await teamService.createTeam(userId, name, description);

    res.status(201).json({
      success: true,
      data: team,
      message: 'Team created successfully',
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const team = await teamService.getTeam(id, userId);

    res.status(200).json({
      success: true,
      data: team,
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const team = await teamService.updateTeam(id, userId, req.body);

    res.status(200).json({
      success: true,
      data: team,
      message: 'Team updated successfully',
    });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    await teamService.deleteTeam(id, userId);

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  }

  async addMember(req: Request, res: Response): Promise<void> {
    const requesterId = req.user!.userId;
    const id = req.params.id as string;
    const { userId, role } = req.body;

    const team = await teamService.addMember(id, requesterId, userId, role);

    res.status(200).json({
      success: true,
      data: team,
      message: 'Member added successfully',
    });
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    const requesterId = req.user!.userId;
    const id = req.params.id as string;
    const userId = req.params.userId as string;

    const team = await teamService.removeMember(id, requesterId, userId);

    res.status(200).json({
      success: true,
      data: team,
      message: 'Member removed successfully',
    });
  }

  async getMembers(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const members = await teamService.getMembers(id, userId);

    res.status(200).json({
      success: true,
      data: members,
    });
  }

  async getMyTeams(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const teams = await teamService.getMyTeams(userId);

    res.status(200).json({
      success: true,
      data: teams,
    });
  }
}
