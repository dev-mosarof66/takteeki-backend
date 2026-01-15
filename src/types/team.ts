import { Team } from '../entities/Team.entity';

export interface CreateTeamDto {
  name: string;
  category: string;
  headCoachId: string;
  winRate?: number;
  matchHistory?: string[];
  subCoachCount?: number;
  isActive?: boolean;
}

export interface UpdateTeamDto {
  name?: string;
  category?: string;
  headCoachId?: string;
  winRate?: number;
  matchHistory?: string[];
  subCoachCount?: number;
  isActive?: boolean;
}

export interface TeamQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  headCoachId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface TeamListResponse {
  status: 'success';
  data: Team[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TeamResponse {
  status: 'success';
  data: Team;
}

export interface UpdateTeamStatusDto {
  isActive: boolean;
}

