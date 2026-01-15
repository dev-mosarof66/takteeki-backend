import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import { RefreshToken } from '../entities/RefreshToken.entity';

export class RefreshTokenRepository {
  private repository: Repository<RefreshToken>;

  constructor() {
    this.repository = AppDataSource.getRepository(RefreshToken);
  }

  async create(tokenData: Partial<RefreshToken>): Promise<RefreshToken> {
    const token = this.repository.create(tokenData);
    return this.repository.save(token);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.repository.findOne({
      where: { token, isActive: true, deletedAt: IsNull() },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    return this.repository.find({
      where: { userId, isActive: true, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeToken(token: string): Promise<boolean> {
    const result = await this.repository.update(
      { token },
      { isActive: false }
    );
    return result.affected !== undefined && result.affected > 0;
  }

  async revokeAllUserTokens(userId: string): Promise<boolean> {
    const result = await this.repository.update(
      { userId, isActive: true },
      { isActive: false }
    );
    return result.affected !== undefined && result.affected > 0;
  }

  async deleteExpiredTokens(): Promise<number> {
    const now = new Date();
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(RefreshToken)
      .where('expiresAt < :now', { now })
      .andWhere('isActive = :isActive', { isActive: false })
      .execute();

    return result.affected || 0;
  }

  async delete(token: string): Promise<boolean> {
    const result = await this.repository.softDelete({ token });
    return result.affected !== undefined && result.affected > 0;
  }
}

