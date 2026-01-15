import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './Base.entity';
import { Player } from './Player.entity';
import { User } from './User.entity';

@Entity('teams')
export class Team extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string; // e.g., "Eagles", "Tigers"

  @Column({ type: 'varchar', length: 50 })
  category!: string; // e.g., "U16", "U18"

  @Column({ type: 'float', default: 0 })
  winRate!: number; // Percentage displayed in the UI (e.g., 67%)

  // Tracks the "Last Match" color indicators (e.g., ['W', 'L', 'D', 'W', 'W'])
  @Column({ type: 'simple-array', nullable: true })
  matchHistory?: string[];

  // --- Relationships ---

  // The Head Coach (Coach Saleh, Coach Ahmed, etc.)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'headCoachId' })
  headCoach!: User;

  @Column({ type: 'uuid' })
  headCoachId!: string;

  // Connection to the Players list
  @OneToMany(() => Player, (player) => player.team)
  players!: Player[];

  // Statistics for the dashboard counters
  @Column({ type: 'int', default: 0 })
  subCoachCount!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}

