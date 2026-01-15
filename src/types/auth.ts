export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  status: 'success';
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  status: 'success';
  token: string;
  refreshToken: string;
}

