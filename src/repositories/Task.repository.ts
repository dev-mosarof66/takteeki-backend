import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Task } from '../entities/Task.entity';

export class TaskRepository {
  private repository: Repository<Task>;

  constructor() {
    this.repository = AppDataSource.getRepository(Task);
  }

  async findByPlayerId(playerId: string): Promise<Task[]> {
    return this.repository.find({
      where: { playerId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Task | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['player'],
    });
  }

  async create(taskData: Partial<Task>): Promise<Task> {
    const task = this.repository.create(taskData);
    return this.repository.save(task);
  }

  async update(id: string, taskData: Partial<Task>): Promise<Task | null> {
    await this.repository.update(id, taskData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return result.affected !== undefined && result.affected > 0;
  }

  async getPlayerTaskStats(playerId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  }> {
    const tasks = await this.repository.find({
      where: { playerId, deletedAt: IsNull() },
    });

    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    };
  }
}

