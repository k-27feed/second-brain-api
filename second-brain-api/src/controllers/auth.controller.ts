import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

/**
 * Send a verification code to the user's phone
 * POST /api/auth/send-verification
 */
export async function sendVerificationCode(req: Request, res: Response): Promise<void> {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }
    
    const verificationId = await authService.sendVerificationCode(phoneNumber);
    
    res.status(200).json({ 
      success: true, 
      verificationId 
    });
  } catch (error) {
    console.error('Error in sendVerificationCode controller:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
}

/**
 * Verify a phone number with a verification code
 * POST /api/auth/verify-code
 */
export async function verifyCode(req: Request, res: Response): Promise<void> {
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      res.status(400).json({ error: 'Phone number and verification code are required' });
      return;
    }
    
    const result = await authService.verifyPhoneNumber(phoneNumber, code);
    
    // Don't send sensitive info in response
    const { user, accessToken, refreshToken } = result;
    const userData = {
      id: user.id,
      phoneNumber: user.phone_number,
      name: user.name
    };
    
    res.status(200).json({
      success: true,
      user: userData,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Error in verifyCode controller:', error);
    
    // Handle specific errors
    if (error instanceof Error && error.message === 'Invalid verification code') {
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }
    
    res.status(500).json({ error: 'Failed to verify code' });
  }
}

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh-token
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }
    
    const result = await authService.refreshAccessToken(refreshToken);
    
    res.status(200).json({
      success: true,
      accessToken: result.accessToken
    });
  } catch (error) {
    console.error('Error in refreshToken controller:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    // User ID should be added by authentication middleware
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    // Implement user service to get user by ID
    // const user = await userService.getUserById(userId);
    
    res.status(200).json({
      success: true,
      user: {
        id: userId,
        // Include other user properties
      }
    });
  } catch (error) {
    console.error('Error in getCurrentUser controller:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
} 