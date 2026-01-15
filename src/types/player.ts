import { Player } from '../entities/Player.entity';
import { Task } from '../entities/Task.entity';

export interface CreatePlayerDto {
  profilePictureUrl?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  teamId: string;
  position: string;
  jerseyNumber: number;
  heightCm?: number;
  weightKg?: number;
  email: string;
  phone: string;
  address?: string;
  emergencyContactName: string;
  emergencyPhone: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdatePlayerDto {
  profilePictureUrl?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | Date;
  teamId?: string;
  position?: string;
  jerseyNumber?: number;
  heightCm?: number;
  weightKg?: number;
  email?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyPhone?: string;
  notes?: string;
  isActive?: boolean;
}

export interface PlayerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  teamId?: string;
  position?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PlayerListResponse {
  status: 'success';
  data: Player[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PlayerResponse {
  status: 'success';
  data: Player;
}

export interface PlayerProfileResponse {
  status: 'success';
  data: {
    player: Player;
    statistics?: PlayerStatistics;
    history?: PlayerHistory[];
    analytics?: PlayerAnalytics;
    activities?: PlayerActivity[];
  };
}

export interface PlayerStatistics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionRate: number;
  averageTaskCompletionTime?: number;
}

export interface PlayerHistory {
  id: string;
  type: 'task_completed' | 'task_assigned' | 'status_changed' | 'profile_updated';
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PlayerAnalytics {
  performanceScore?: number;
  taskCompletionTrend?: Array<{ date: string; completed: number }>;
  activityLevel?: 'high' | 'medium' | 'low';
  lastActiveDate?: Date;
}

export interface PlayerActivity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PlayerNoteDto {
  note: string;
}

export interface PlayerNote {
  id: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePlayerStatusDto {
  isActive: boolean;
}

export interface TaskResponse {
  status: 'success';
  data: Task[];
}

