import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../entities/User.entity';
import { UserRepository } from '../repositories/User.repository';
import { RefreshTokenRepository } from '../repositories/RefreshToken.repository';
import { config } from '../config/env';
import {
  RegisterDto,
  LoginDto,
  JWTPayload,
  UserRole,
  AuthResponse,
  RefreshTokenDto,
  RefreshTokenResponse,
} from '../types/auth';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  private userRepository: UserRepository;
  private refreshTokenRepository: RefreshTokenRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   */
  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access token (short-lived)
   */
  private generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token (long-lived, stored in DB)
   */
  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Calculate expiration date for refresh token
   */
  private getRefreshTokenExpiration(): Date {
    const expiresIn = config.jwt.refreshExpiresIn;
    const days = parseInt(expiresIn.replace('d', ''), 10);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    return expirationDate;
  }

  /**
   * Create and store refresh token
   */
  private async createRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<string> {
    const token = this.generateRefreshToken();
    const expiresAt = this.getRefreshTokenExpiration();

    await this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
      isActive: true,
    });

    return token;
  }

  /**
   * Verify JWT access token
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  /**
   * Verify refresh token
   */
  private async verifyRefreshToken(token: string): Promise<JWTPayload> {
    const refreshToken = await this.refreshTokenRepository.findByToken(token);

    if (!refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (refreshToken.expiresAt < new Date()) {
      // Token expired, mark as inactive
      await this.refreshTokenRepository.revokeToken(token);
      throw new AppError('Refresh token expired', 401);
    }

    if (!refreshToken.isActive) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    // Get user to return payload
    const user = refreshToken.user;
    if (!user || !user.isActive) {
      throw new AppError('User account is deactivated', 403);
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Register a new user
   */
  async register(
    data: RegisterDto,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || UserRole.USER,
    });

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await this.createRefreshToken(user.id, userAgent, ipAddress);

    return {
      status: 'success',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Login user
   */
  async login(
    data: LoginDto,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await this.createRefreshToken(user.id, userAgent, ipAddress);

    return {
      status: 'success',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(data: RefreshTokenDto): Promise<RefreshTokenResponse> {
    // Verify refresh token
    const payload = await this.verifyRefreshToken(data.refreshToken);

    // Generate new access token
    const accessToken = this.generateAccessToken(payload);

    // Optionally rotate refresh token (for better security)
    // For now, we'll return the same refresh token
    // You can implement token rotation if needed

    return {
      status: 'success',
      token: accessToken,
      refreshToken: data.refreshToken,
    };
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(token: string): Promise<boolean> {
    return this.refreshTokenRepository.revokeToken(token);
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<boolean> {
    return this.refreshTokenRepository.revokeAllUserTokens(userId);
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
}
