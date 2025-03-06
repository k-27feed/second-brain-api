import { Request, Response } from 'express';
import twilioService from '../services/twilio.service';
import openaiService from '../services/openai.service';
import * as callModel from '../models/call.model';

/**
 * Generate a Twilio access token for voice calls
 * GET /api/calls/token
 */
export async function generateToken(req: Request, res: Response): Promise<void> {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    // Generate token using user ID as identity
    const identity = `user-${userId}`;
    const token = twilioService.generateAccessToken(identity);
    
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
}

/**
 * Handle incoming Twilio voice call
 * POST /api/calls/incoming
 */
export async function handleIncomingCall(req: Request, res: Response): Promise<void> {
  try {
    // Extract call data from Twilio request
    const { From, To, CallSid } = req.body;
    
    console.log(`Incoming call from ${From} to ${To} (CallSid: ${CallSid})`);
    
    // Generate TwiML response
    // For incoming calls, we don't have a specific user, so we'll use a generic identifier
    const twiml = twilioService.generateOpenAICallTwiML('anonymous');
    
    // Log call in database if needed
    // await callModel.create({ ... });
    
    // Send TwiML response
    res.set('Content-Type', 'text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('Error handling incoming call:', error);
    res.status(500).json({ error: 'Failed to handle incoming call' });
  }
}

/**
 * Handle OpenAI stream for Twilio call
 * POST /api/calls/openai-stream/:userId
 */
export async function handleOpenAIStream(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    
    // In a real implementation, this would stream audio between Twilio and OpenAI
    // For now, we'll just log that we received the request
    console.log(`OpenAI stream requested for user ${userId}`);
    
    // This should eventually handle WebSocket connections and audio streaming
    res.status(200).json({ message: 'OpenAI stream endpoint' });
  } catch (error) {
    console.error('Error handling OpenAI stream:', error);
    res.status(500).json({ error: 'Failed to handle OpenAI stream' });
  }
}

/**
 * Initiate an outgoing call from Twilio to user
 * POST /api/calls/outgoing
 */
export async function initiateOutgoingCall(req: Request, res: Response): Promise<void> {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }
    
    // Generate TwiML for the call
    const twimlUrl = `${req.protocol}://${req.get('host')}/api/calls/twiml/${userId}`;
    
    // Make the call
    const call = await twilioService.makeOutgoingCall(phoneNumber, twimlUrl);
    
    // Store call details in database
    // await callModel.create({ ... });
    
    res.status(200).json({
      success: true,
      callSid: call.sid,
      status: call.status
    });
  } catch (error) {
    console.error('Error initiating outgoing call:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
}

/**
 * Get call history for a user
 * GET /api/calls/history
 */
export async function getCallHistory(req: Request, res: Response): Promise<void> {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    // Get call history from database
    // const calls = await callModel.findByUserId(userId);
    
    // For now, return a placeholder
    const calls = [
      {
        id: 1,
        direction: 'incoming',
        status: 'completed',
        duration: 120,
        createdAt: new Date().toISOString()
      }
    ];
    
    res.status(200).json({
      success: true,
      calls
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).json({ error: 'Failed to get call history' });
  }
} 