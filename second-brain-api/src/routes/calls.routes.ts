import { Router } from 'express';
import * as callsController from '../controllers/calls.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/calls/token
 * @desc    Generate Twilio access token for voice calls
 * @access  Private
 */
router.get('/token', authenticateJWT, callsController.generateToken);

/**
 * @route   POST /api/calls/incoming
 * @desc    Handle incoming Twilio voice call
 * @access  Public (Twilio webhook)
 */
router.post('/incoming', callsController.handleIncomingCall);

/**
 * @route   POST /api/calls/openai-stream/:userId
 * @desc    Handle OpenAI stream for Twilio call
 * @access  Public (Twilio webhook)
 */
router.post('/openai-stream/:userId', callsController.handleOpenAIStream);

/**
 * @route   POST /api/calls/outgoing
 * @desc    Initiate an outgoing call from Twilio to user
 * @access  Private
 */
router.post('/outgoing', authenticateJWT, callsController.initiateOutgoingCall);

/**
 * @route   GET /api/calls/history
 * @desc    Get call history for a user
 * @access  Private
 */
router.get('/history', authenticateJWT, callsController.getCallHistory);

export default router; 