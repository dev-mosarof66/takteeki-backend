import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './Base.entity';
import { Team } from './Team.entity';
import { Task } from './Task.entity';

@Entity('players')
export class Player extends BaseEntity {
  // --- Profile Picture ---
  @Column({ type: 'varchar', length: 255, nullable: true })
  profilePictureUrl?: string;

  // --- Basic Information ---
  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'date' })
  dateOfBirth!: Date;

  @ManyToOne(() => Team, (team) => team.players)
  @JoinColumn({ name: 'teamId' })
  team!: Team;

  @Column({ type: 'uuid' })
  teamId!: string;

  // --- Position & Physical Information ---
  @Column({ type: 'varchar', length: 50 })
  position!: string;

  @Column({ type: 'int' })
  jerseyNumber!: number;

  @Column({ type: 'float', nullable: true })
  heightCm?: number; // Height (cm)

  @Column({ type: 'float', nullable: true })
  weightKg?: number; // Weight (kg)

  // --- Contact Information ---
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  // --- Emergency Contact ---
  @Column({ type: 'varchar', length: 255 })
  emergencyContactName!: string;

  @Column({ type: 'varchar', length: 20 })
  emergencyPhone!: string;

  // --- Additional Notes ---
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // --- Relationships ---
  @OneToMany(() => Task, (task) => task.player)
  tasks!: Task[];
}

