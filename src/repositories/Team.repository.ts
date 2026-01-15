import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Team } from '../entities/Team.entity';
import { TeamQueryParams } from '../types/team';

export class TeamRepository {
  private repository: Repository<Team>;

  constructor() {
    this.repository = AppDataSource.getRepository(Team);
  }

  async findAll(queryParams: TeamQueryParams = {}): Promise<{ teams: Team[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      headCoachId,
      isActive,
      sortBy = 'name',
      sortOrder = 'ASC',
    } = queryParams;

    const queryBuilder = this.repository
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.headCoach', 'headCoach')
      .leftJoinAndSelect('team.players', 'players')
      .where('team.deletedAt IS NULL');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(team.name ILIKE :search OR team.category ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('team.category = :category', { category });
    }

    if (headCoachId) {
      queryBuilder.andWhere('team.headCoachId = :headCoachId', { headCoachId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('team.isActive = :isActive', { isActive });
    }

    // Apply sorting
    if (sortBy && ['name', 'category', 'winRate', 'createdAt'].includes(sortBy)) {
      queryBuilder.orderBy(`team.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('team.name', sortOrder);
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [teams, total] = await queryBuilder.getManyAndCount();

    return { teams, total };
  }

  async findById(id: string): Promise<Team | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['headCoach', 'players'],
    });
  }

  async findByHeadCoachId(headCoachId: string): Promise<Team[]> {
    return this.repository.find({
      where: { headCoachId, deletedAt: IsNull() },
      relations: ['headCoach', 'players'],
    });
  }

  async create(teamData: Partial<Team>): Promise<Team> {
    const team = this.repository.create(teamData);
    return this.repository.save(team);
  }

  async update(id: string, teamData: Partial<Team>): Promise<Team | null> {
    await this.repository.update(id, teamData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return result.affected !== undefined && result.affected > 0;
  }

  async updateStatus(id: string, isActive: boolean): Promise<Team | null> {
    await this.repository.update(id, { isActive });
    return this.findById(id);
  }
}


