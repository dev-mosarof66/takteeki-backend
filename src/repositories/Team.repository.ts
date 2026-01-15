import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Team } from '../entities/Team.entity';

export class TeamRepository {
  private repository: Repository<Team>;

  constructor() {
    this.repository = AppDataSource.getRepository(Team);
  }

  async findAll(): Promise<Team[]> {
    return this.repository.find({
      where: { deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Team | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['players'],
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
}

