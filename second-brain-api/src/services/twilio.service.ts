import twilio, { Twilio } from 'twilio';
import { AccessToken } from 'twilio';
import { VoiceGrant } from 'twilio/lib/jwt/AccessToken';
import env from '../config/env';
import { logger } from '../utils/logger';

class TwilioService {
  private client: Twilio;
  private accountSid: string;
  private authToken: string;
  private verifyServiceSid: string;
  private phoneNumber: string;
  private apiKey: string;
  private apiSecret: string;
  
  constructor() {
    this.accountSid = env.twilio.accountSid;
    this.authToken = env.twilio.authToken;
    this.verifyServiceSid = env.twilio.verifyServiceSid;
    this.phoneNumber = env.twilio.phoneNumber;
    this.apiKey = env.twilio.apiKey;
    this.apiSecret = env.twilio.apiSecret;
    
    // Initialize Twilio client
    this.client = twilio(this.accountSid, this.authToken);
  }

  /**
   * Send SMS message using Twilio
   */
  async sendSMS(to: string, body: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        body,
        from: this.phoneNumber,
        to,
      });

      return message.sid;
    } catch (error) {
      logger.error('Twilio SMS error:', error);
      throw new Error('Failed to send SMS message');
    }
  }

  /**
   * Make a phone call with text-to-speech
   */
  async makeCall(to: string, text: string): Promise<string> {
    try {
      // Create TwiML for the call
      const twiml = `
        <Response>
          <Say voice="${env.twilio.ttsVoice}">${text}</Say>
        </Response>
      `;

      // Make the call
      const call = await this.client.calls.create({
        twiml,
        to,
        from: this.phoneNumber,
      });

      return call.sid;
    } catch (error) {
      logger.error('Twilio call error:', error);
      throw new Error('Failed to make phone call');
    }
  }

  /**
   * Send verification code via SMS
   */
  async sendVerificationCode(phoneNumber: string): Promise<string> {
    try {
      // Generate a random 6-digit code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Send the code via SMS
      await this.sendSMS(
        phoneNumber,
        `Your Second Brain verification code is: ${verificationCode}`
      );
      
      return verificationCode;
    } catch (error) {
      logger.error('Verification code error:', error);
      throw new Error('Failed to send verification code');
    }
  }

  /**
   * Create a voice recording URL for transcription
   */
  createVoiceRecordingUrl(): { token: string; roomName: string } {
    try {
      // Create a unique room name
      const roomName = `recording-${Date.now()}`;
      
      // Generate an access token
      const AccessToken = twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;
      
      // Create a voice grant
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: this.verifyServiceSid,
        incomingAllow: true,
      });
      
      // Create an access token
      const token = new AccessToken(
        this.accountSid,
        this.apiKey,
        this.apiSecret,
        { identity: `user-${Date.now()}` }
      );
      
      // Add the voice grant to the token
      token.addGrant(voiceGrant);
      
      return {
        token: token.toJwt(),
        roomName,
      };
    } catch (error) {
      logger.error('Voice recording URL error:', error);
      throw new Error('Failed to create voice recording URL');
    }
  }

  /**
   * Verify code sent to phone number
   */
  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const verificationCheck = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code
        });
      
      return verificationCheck.status === 'approved';
    } catch (error) {
      console.error('Error verifying code:', error);
      throw new Error('Failed to verify code');
    }
  }

  /**
   * Generate access token for Twilio Voice SDK
   */
  generateAccessToken(identity: string): string {
    try {
      // Create an access token
      const accessToken = new AccessToken(
        this.accountSid,
        this.apiKey,
        this.apiSecret,
        { identity }
      );

      // Create a Voice grant for this token
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: this.accountSid,
        incomingAllow: true,
      });

      // Add the grant to the token
      accessToken.addGrant(voiceGrant);

      // Generate the token
      return accessToken.toJwt();
    } catch (error) {
      console.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Initiate a call to a user from the Twilio number
   */
  async makeOutgoingCall(toPhoneNumber: string, twimlUrl: string): Promise<any> {
    try {
      const call = await this.client.calls.create({
        url: twimlUrl,
        to: toPhoneNumber,
        from: this.phoneNumber,
      });
      
      return call;
    } catch (error) {
      console.error('Error making outgoing call:', error);
      throw new Error('Failed to make outgoing call');
    }
  }

  /**
   * Generate TwiML for connecting to OpenAI
   */
  generateOpenAICallTwiML(userId: string): string {
    // This would typically point to a webhook URL that streams audio to OpenAI
    const openAiWebhookUrl = `${env.appUrl}/api/calls/openai-stream/${userId}`;
    
    const twiml = `
      <Response>
        <Say voice="${env.twilio.ttsVoice}">Connecting you to your Second Brain AI assistant.</Say>
        <Connect>
          <Stream url="${openAiWebhookUrl}" />
        </Connect>
      </Response>
    `;
    
    return twiml;
  }
}

// Create a singleton instance
const twilioService = new TwilioService();

export default twilioService; 