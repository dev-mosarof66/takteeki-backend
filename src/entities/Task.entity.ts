import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './Base.entity';
import { Player } from './Player.entity';

@Entity('tasks')
export class Task extends BaseEntity {
  @Column({ type: 'uuid' })
  playerId!: string;

  @ManyToOne(() => Player, (player) => player.tasks)
  @JoinColumn({ name: 'playerId' })
  player!: Player;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  })
  status!: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @Column({ type: 'date', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', default: 0 })
  priority!: number; // 0 = low, 1 = medium, 2 = high

  @Column({ type: 'text', nullable: true })
  notes?: string;
}

