import twilio, { Twilio } from 'twilio';
import { AccessToken } from 'twilio';
import { VoiceGrant } from 'twilio/lib/jwt/AccessToken';
import env from '../config/env';

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
   * Send verification code to phone number
   */
  async sendVerificationCode(phoneNumber: string): Promise<string> {
    try {
      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms'
        });
      
      return verification.sid;
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw new Error('Failed to send verification code');
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