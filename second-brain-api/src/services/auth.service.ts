import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import env from '../config/env';
import * as userModel from '../models/user.model';
import * as authModel from '../models/auth.model';
import twilioService from './twilio.service';

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(userId: number): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(
    { userId },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    env.jwt.secret,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, env.jwt.secret) as { userId: number };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Send verification code to user's phone
 */
export async function sendVerificationCode(phoneNumber: string): Promise<string> {
  try {
    // Format phone number if needed
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    
    // Send verification code via Twilio
    const verificationId = await twilioService.sendVerificationCode(formattedPhoneNumber);
    
    // Check if user already exists
    let user = await userModel.findByPhoneNumber(formattedPhoneNumber);
    
    // If user doesn't exist, create a new user record
    if (!user) {
      user = await userModel.create({ phone_number: formattedPhoneNumber });
    }
    
    // Store verification ID in auth record
    await authModel.upsert({
      user_id: user.id,
      verification_id: verificationId
    });
    
    return verificationId;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw new Error('Failed to send verification code');
  }
}

/**
 * Verify user's phone with verification code
 */
export async function verifyPhoneNumber(phoneNumber: string, code: string): Promise<{ accessToken: string; refreshToken: string; user: userModel.User }> {
  try {
    // Format phone number if needed
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    
    // Verify code via Twilio
    const isVerified = await twilioService.verifyCode(formattedPhoneNumber, code);
    
    if (!isVerified) {
      throw new Error('Invalid verification code');
    }
    
    // Find user by phone number
    const user = await userModel.findByPhoneNumber(formattedPhoneNumber);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateToken(user.id);
    
    // Store refresh token in auth record
    await authModel.update(user.id, { refresh_token: refreshToken });
    
    return { accessToken, refreshToken, user };
  } catch (error) {
    console.error('Error verifying phone number:', error);
    throw new Error('Failed to verify phone number');
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, env.jwt.secret) as { userId: number; type: string };
    
    if (!decoded || decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    
    // Check if refresh token exists in database
    const authRecord = await authModel.findByRefreshToken(refreshToken);
    
    if (!authRecord) {
      throw new Error('Refresh token not found');
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );
    
    return { accessToken };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Format phone number to E.164 format (e.g., +1234567890)
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If already in E.164 format (starts with '+'), return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // If US number without country code (10 digits)
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  
  // If already has country code (usually 11 digits with US country code '1')
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }
  
  // Default: return as is with '+' prefix
  return `+${digitsOnly}`;
} 