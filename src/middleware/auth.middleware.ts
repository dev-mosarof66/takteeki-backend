import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types/auth';
import { AuthService } from '../services/auth.service';
import { AppError } from './errorHandler';

const authService = new AuthService();

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Attach user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid token', 401));
    }
  }
};

/**
 * Middleware to check if user has required role(s)
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to access this resource', 403)
      );
    }

    next();
  };
};

/**
 * Combined middleware: authenticate + authorize
 */
export const requireAuth = (roles?: UserRole[]) => {
  return [
    authenticate,
    ...(roles ? [authorize(...roles)] : []),
  ];
};

