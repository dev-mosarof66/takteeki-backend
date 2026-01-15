import { Repository, IsNull, Like } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Player } from '../entities/Player.entity';
import { PlayerQueryParams } from '../types/player';

export class PlayerRepository {
  private repository: Repository<Player>;

  constructor() {
    this.repository = AppDataSource.getRepository(Player);
  }

  async findAll(queryParams: PlayerQueryParams = {}): Promise<{ players: Player[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      teamId,
      position,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryParams;

    const queryBuilder = this.repository
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.team', 'team')
      .where('player.deletedAt IS NULL');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(player.firstName ILIKE :search OR player.lastName ILIKE :search OR player.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (teamId) {
      queryBuilder.andWhere('player.teamId = :teamId', { teamId });
    }

    if (position) {
      queryBuilder.andWhere('player.position = :position', { position });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('player.isActive = :isActive', { isActive });
    }

    // Apply sorting
    if (sortBy && ['firstName', 'lastName', 'createdAt', 'jerseyNumber'].includes(sortBy)) {
      queryBuilder.orderBy(`player.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('player.createdAt', sortOrder);
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [players, total] = await queryBuilder.getManyAndCount();

    return { players, total };
  }

  async findById(id: string): Promise<Player | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['team', 'tasks'],
    });
  }

  async findByEmail(email: string): Promise<Player | null> {
    return this.repository.findOne({
      where: { email, deletedAt: IsNull() },
      relations: ['team'],
    });
  }

  async search(searchTerm: string, limit: number = 20): Promise<Player[]> {
    return this.repository.find({
      where: [
        { firstName: Like(`%${searchTerm}%`), deletedAt: IsNull() },
        { lastName: Like(`%${searchTerm}%`), deletedAt: IsNull() },
        { email: Like(`%${searchTerm}%`), deletedAt: IsNull() },
      ],
      take: limit,
      relations: ['team'],
    });
  }

  async create(playerData: Partial<Player>): Promise<Player> {
    const player = this.repository.create(playerData);
    return this.repository.save(player);
  }

  async update(id: string, playerData: Partial<Player>): Promise<Player | null> {
    await this.repository.update(id, playerData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return result.affected !== undefined && result.affected > 0;
  }

  async updateStatus(id: string, isActive: boolean): Promise<Player | null> {
    await this.repository.update(id, { isActive });
    return this.findById(id);
  }

  async findByTeamId(teamId: string): Promise<Player[]> {
    return this.repository.find({
      where: { teamId, deletedAt: IsNull() },
      relations: ['team'],
    });
  }
}

