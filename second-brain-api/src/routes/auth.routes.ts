import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/send-verification
 * @desc    Send verification code to phone number
 * @access  Public
 */
router.post('/send-verification', authController.sendVerificationCode);

/**
 * @route   POST /api/auth/verify-code
 * @desc    Verify phone number with code
 * @access  Public
 */
router.post('/verify-code', authController.verifyCode);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateJWT, authController.getCurrentUser);

export default router; 