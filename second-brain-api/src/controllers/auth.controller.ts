import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { body, validationResult } from 'express-validator';
import User from '../models/user.model';
import { logger } from '../utils/logger';

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

// Validation rules
export const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create a new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
    });

    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // The user is attached to the request object from the auth middleware
    const user = await User.findById(req.user?._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
}; 