import { PlayerRepository } from '../repositories/Player.repository';
import { TaskRepository } from '../repositories/Task.repository';
import { TeamRepository } from '../repositories/Team.repository';
import {
  CreatePlayerDto,
  UpdatePlayerDto,
  PlayerQueryParams,
  PlayerListResponse,
  PlayerResponse,
  PlayerProfileResponse,
  PlayerStatistics,
  PlayerHistory,
  PlayerAnalytics,
  PlayerActivity,
  PlayerNoteDto,
  UpdatePlayerStatusDto,
  TaskResponse,
} from '../types/player';
import { AppError } from '../middleware/errorHandler';
import { Player } from '../entities/Player.entity';
// import { Task } from '../entities/Task.entity';

export class PlayerService {
  private playerRepository: PlayerRepository;
  private taskRepository: TaskRepository;
  private teamRepository: TeamRepository;

  constructor() {
    this.playerRepository = new PlayerRepository();
    this.taskRepository = new TaskRepository();
    this.teamRepository = new TeamRepository();
  }

  /**
   * Create a new player
   */
  async createPlayer(data: CreatePlayerDto): Promise<PlayerResponse> {
    // Check if email already exists
    const existingPlayer = await this.playerRepository.findByEmail(data.email);
    if (existingPlayer) {
      throw new AppError('Player with this email already exists', 409);
    }

    // Verify team exists
    const team = await this.teamRepository.findById(data.teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Check if jersey number is already taken in the team
    const teamPlayers = await this.playerRepository.findByTeamId(data.teamId);
    const jerseyTaken = teamPlayers.some(
      (p) => p.jerseyNumber === data.jerseyNumber
    );
    if (jerseyTaken) {
      throw new AppError('Jersey number is already taken in this team', 409);
    }

    // Convert dateOfBirth string to Date if needed
    const dateOfBirth = typeof data.dateOfBirth === 'string' ? new Date(data.dateOfBirth) : data.dateOfBirth;

    const player = await this.playerRepository.create({
      ...data,
      dateOfBirth,
      isActive: data.isActive ?? true,
    });

    return {
      status: 'success',
      data: player,
    };
  }

  /**
   * Get all players with pagination and filters
   */
  async getAllPlayers(queryParams: PlayerQueryParams): Promise<PlayerListResponse> {
    const { page = 1, limit = 10 } = queryParams;
    const { players, total } = await this.playerRepository.findAll(queryParams);
    const totalPages = Math.ceil(total / limit);

    return {
      status: 'success',
      data: players,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get player by ID
   */
  async getPlayerById(playerId: string): Promise<PlayerResponse> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new AppError('Player not found', 404);
    }

    return {
      status: 'success',
      data: player,
    };
  }

  /**
   * Update player information
   */
  async updatePlayer(playerId: string, data: UpdatePlayerDto): Promise<PlayerResponse> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new AppError('Player not found', 404);
    }

    // Check if email is being updated and if it's already taken
    if (data.email && data.email !== player.email) {
      const existingPlayer = await this.playerRepository.findByEmail(data.email);
      if (existingPlayer) {
        throw new AppError('Email is already taken by another player', 409);
      }
    }

    // Check if team is being updated
    if (data.teamId && data.teamId !== player.teamId) {
      const team = await this.teamRepository.findById(data.teamId);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      // Check jersey number in new team
      if (data.jerseyNumber) {
        const teamPlayers = await this.playerRepository.findByTeamId(data.teamId);
        const jerseyTaken = teamPlayers.some(
          (p) => p.jerseyNumber === data.jerseyNumber && p.id !== playerId
        );
        if (jerseyTaken) {
          throw new AppError('Jersey number is already taken in this team', 409);
        }
      }
    }

    // Convert dateOfBirth if provided and prepare update data
    const { dateOfBirth, ...restData } = data;
    const updateData: Partial<Player> = { ...restData };
    
    if (dateOfBirth) {
      updateData.dateOfBirth =
        typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    }

    const updatedPlayer = await this.playerRepository.update(playerId, updateData);
    if (!updatedPlayer) {
      throw new AppError('Failed to update player', 500);
    }

    return {
      status: 'success',
      data: updatedPlayer,
    };
  }

  /**
   * Delete player (soft delete)
   */
  async deletePlayer(playerId: string): Promise<{ status: 'success'; message: string }> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new AppError('Player not found', 404);
    }

    const deleted = await this.playerRepository.delete(playerId);
    if (!deleted) {
      throw new AppError('Failed to delete player', 500);
    }

    return {
      status: 'success',
      message: 'Player deleted successfully',
    };
  }

  /**
   * Search players
   */
  async searchPlayers(searchTerm: string, limit: number = 20): Promise<PlayerListResponse> {
    const players = await this.playerRepository.search(searchTerm, limit);

    return {
      status: 'success',
      data: players,
      pagination: {
        page: 1,
        limit,
        total: players.length,
        totalPages: 1,
      },
    };
  }

  /**
   * Get player's assigned tasks
   */
  async getPlayerTasks(playerId: string): Promise<TaskResponse> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new AppError('Player not found', 404);
    }

    const tasks = await this.taskRepository.findByPlayerId(playerId);

    return {
      status: 'success',
      data: tasks,
    };
  }

  /**
   * Update player status
   */
  async updatePlayerStatus(
    playerId: string,
    data: UpdatePlayerStatusDto
  ): Promise<PlayerResponse> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new AppError('Player not found', 404);
    }

    const updatedPlayer = await this.playerRepository.updateStatus(playerId, data.isActive);
    if (!updatedPlayer) {
      throw new AppError('Failed to update player status', 500);
    }

    return {
      status: 'success',
      data: updatedPlayer,
    };
  }

  /**
   * Get complete player profile
   */
  async getPlayerProfile(playerId: string): Promise<PlayerProfileResponse> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new AppError('Player not found', 404);
    }

    const statistics = await this.getPlayerStatistics(playerId);
    const history = await this.getPlayerHistory(playerId);
    const analytics = await this.getPlayerAnalytics(playerId);
    const activities = await this.getPlayerActivities(playerId);

    return {
      status: 'success',
      data: {
        player,
        statistics,
        history,
        analytics,
        activities,
      },
    };
  }

  /**
   * Get player statistics
   */
  async getPlayerStatistics(playerId: string): Promise<PlayerStatistics> {
    const stats = await this.taskRepository.getPlayerTaskStats(playerId);
    const completionRate =
      stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return {
      totalTasks: stats.total,
      completedTasks: stats.completed,
      pendingTasks: stats.pending,
      inProgressTasks: stats.inProgress,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }

  /**
   * Get player history
   */
  async getPlayerHistory(playerId: string): Promise<PlayerHistory[]> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      return [];
    }

    const tasks = await this.taskRepository.findByPlayerId(playerId);
    const history: PlayerHistory[] = [];

    // Add task-related history
    tasks.forEach((task) => {
      history.push({
        id: task.id,
        type: 'task_assigned',
        description: `Task "${task.title}" was assigned`,
        timestamp: task.createdAt,
        metadata: { taskId: task.id, taskTitle: task.title },
      });

      if (task.status === 'completed' && task.completedAt) {
        history.push({
          id: `${task.id}-completed`,
          type: 'task_completed',
          description: `Task "${task.title}" was completed`,
          timestamp: task.completedAt,
          metadata: { taskId: task.id, taskTitle: task.title },
        });
      }
    });

    // Add player creation history
    history.push({
      id: `${player.id}-created`,
      type: 'profile_updated',
      description: 'Player profile was created',
      timestamp: player.createdAt,
    });

    // Sort by timestamp descending
    return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get player analytics
   */
  async getPlayerAnalytics(playerId: string): Promise<PlayerAnalytics> {
    const stats = await this.getPlayerStatistics(playerId);
    const tasks = await this.taskRepository.findByPlayerId(playerId);

    // Calculate performance score (0-100)
    const performanceScore = stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

    // Determine activity level
    let activityLevel: 'high' | 'medium' | 'low' = 'low';
    if (stats.totalTasks >= 10) {
      activityLevel = 'high';
    } else if (stats.totalTasks >= 5) {
      activityLevel = 'medium';
    }

    // Get last active date (most recent task completion or creation)
    const completedTasks = tasks.filter((t) => t.status === 'completed' && t.completedAt);
    const lastActiveDate = completedTasks.length > 0
      ? completedTasks.sort((a, b) => {
          const dateA = a.completedAt || new Date(0);
          const dateB = b.completedAt || new Date(0);
          return dateB.getTime() - dateA.getTime();
        })[0].completedAt
      : undefined;

    return {
      performanceScore,
      activityLevel,
      lastActiveDate,
    };
  }

  /**
   * Get player activities (timeline)
   */
  async getPlayerActivities(playerId: string): Promise<PlayerActivity[]> {
    const history = await this.getPlayerHistory(playerId);
    return history.map((h) => ({
      id: h.id,
      type: h.type,
      description: h.description,
      timestamp: h.timestamp,
      metadata: h.metadata,
    }));
  }

  /**
   * Update player profile
   */
  async updatePlayerProfile(
    playerId: string,
    data: UpdatePlayerDto
  ): Promise<PlayerResponse> {
    return this.updatePlayer(playerId, data);
  }

  /**
   * Add notes to player profile
   */
  async addPlayerNote(
    playerId: string,
    data: PlayerNoteDto
  ): Promise<{ status: 'success'; message: string }> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new AppError('Player not found', 404);
    }

    const currentNotes = player.notes || '';
    const newNote = `[${new Date().toISOString()}] ${data.note}\n`;
    const updatedNotes = currentNotes + newNote;

    await this.playerRepository.update(playerId, { notes: updatedNotes });

    return {
      status: 'success',
      message: 'Note added successfully',
    };
  }

  /**
   * Get player notes
   */
  async getPlayerNotes(playerId: string): Promise<{
    status: 'success';
    data: { notes: string | null };
  }> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new AppError('Player not found', 404);
    }

    return {
      status: 'success',
      data: {
        notes: player.notes || null,
      },
    };
  }

  /**
   * Get player timeline events
   */
  async getPlayerTimeline(playerId: string): Promise<{
    status: 'success';
    data: PlayerActivity[];
  }> {
    const activities = await this.getPlayerActivities(playerId);

    return {
      status: 'success',
      data: activities,
    };
  }
}

