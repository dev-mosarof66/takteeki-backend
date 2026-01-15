import { TeamRepository } from '../repositories/Team.repository';
import { UserRepository } from '../repositories/User.repository';
import { PlayerRepository } from '../repositories/Player.repository';
import {
  CreateTeamDto,
  UpdateTeamDto,
  TeamQueryParams,
  TeamListResponse,
  TeamResponse,
  UpdateTeamStatusDto,
} from '../types/team';
import { PlayerListResponse } from '../types/player';
import { AppError } from '../middleware/errorHandler';
// import { Team } from '../entities/Team.entity';

export class TeamService {
  private teamRepository: TeamRepository;
  private userRepository: UserRepository;
  private playerRepository: PlayerRepository;

  constructor() {
    this.teamRepository = new TeamRepository();
    this.userRepository = new UserRepository();
    this.playerRepository = new PlayerRepository();
  }

  /**
   * Create a new team
   */
  async createTeam(data: CreateTeamDto): Promise<TeamResponse> {
    // Verify head coach exists
    const headCoach = await this.userRepository.findById(data.headCoachId);
    if (!headCoach) {
      throw new AppError('Head coach not found', 404);
    }

    const team = await this.teamRepository.create({
      ...data,
      winRate: data.winRate ?? 0,
      subCoachCount: data.subCoachCount ?? 0,
      isActive: data.isActive ?? true,
    });

    return {
      status: 'success',
      data: team,
    };
  }

  /**
   * Get all teams with pagination and filters
   */
  async getAllTeams(queryParams: TeamQueryParams): Promise<TeamListResponse> {
    const { page = 1, limit = 10 } = queryParams;
    const { teams, total } = await this.teamRepository.findAll(queryParams);
    const totalPages = Math.ceil(total / limit);

    return {
      status: 'success',
      data: teams,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId: string): Promise<TeamResponse> {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    return {
      status: 'success',
      data: team,
    };
  }

  /**
   * Update team information
   */
  async updateTeam(teamId: string, data: UpdateTeamDto): Promise<TeamResponse> {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Check if head coach is being updated
    if (data.headCoachId && data.headCoachId !== team.headCoachId) {
      const headCoach = await this.userRepository.findById(data.headCoachId);
      if (!headCoach) {
        throw new AppError('Head coach not found', 404);
      }
    }

    const updatedTeam = await this.teamRepository.update(teamId, data);
    if (!updatedTeam) {
      throw new AppError('Failed to update team', 500);
    }

    return {
      status: 'success',
      data: updatedTeam,
    };
  }

  /**
   * Delete team (soft delete)
   */
  async deleteTeam(teamId: string): Promise<{ status: 'success'; message: string }> {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const deleted = await this.teamRepository.delete(teamId);
    if (!deleted) {
      throw new AppError('Failed to delete team', 500);
    }

    return {
      status: 'success',
      message: 'Team deleted successfully',
    };
  }

  /**
   * Update team status
   */
  async updateTeamStatus(teamId: string, data: UpdateTeamStatusDto): Promise<TeamResponse> {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const updatedTeam = await this.teamRepository.updateStatus(teamId, data.isActive);
    if (!updatedTeam) {
      throw new AppError('Failed to update team status', 500);
    }

    return {
      status: 'success',
      data: updatedTeam,
    };
  }

  /**
   * Get teams by head coach
   */
  async getTeamsByHeadCoach(headCoachId: string): Promise<TeamListResponse> {
    const teams = await this.teamRepository.findByHeadCoachId(headCoachId);

    return {
      status: 'success',
      data: teams,
    };
  }

  /**
   * Get all players of a team
   */
  async getTeamPlayers(teamId: string): Promise<PlayerListResponse> {
    // Verify team exists
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const players = await this.playerRepository.findByTeamId(teamId);

    return {
      status: 'success',
      data: players,
      pagination: {
        page: 1,
        limit: players.length,
        total: players.length,
        totalPages: 1,
      },
    };
  }
}

