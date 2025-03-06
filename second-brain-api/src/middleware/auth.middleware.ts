import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT token
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  
  // Check if bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Token format invalid' });
    return;
  }
  
  const token = parts[1];
  
  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  
  // Add user to request
  req.user = { id: decoded.userId };
  
  // Proceed to next middleware
  next();
}

/**
 * Optional JWT authentication middleware
 * Does not reject if token is invalid or missing
 */
export function optionalAuthJWT(req: Request, res: Response, next: NextFunction): void {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    next();
    return;
  }
  
  // Check if bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next();
    return;
  }
  
  const token = parts[1];
  
  // Verify token
  const decoded = verifyToken(token);
  if (decoded) {
    // Add user to request if token is valid
    req.user = { id: decoded.userId };
  }
  
  // Proceed to next middleware
  next();
} 