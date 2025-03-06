import OpenAI from 'openai';
import env from '../config/env';
import { logger } from '../utils/logger';

class OpenAIService {
  private client: OpenAI;
  private assistantModel: string;
  
  constructor() {
    this.client = new OpenAI({
      apiKey: env.openai.apiKey,
    });
    this.assistantModel = env.openai.assistantModel;
  }

  /**
   * Generate a response using the OpenAI API
   */
  async generateResponse(message: string, context: string[] = []): Promise<string> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a helpful second brain assistant that helps users remember 
          important information and manage their daily life. Be concise, helpful, 
          and try to assist the user with their needs.`
        },
        ...context.map(msg => ({ role: 'user', content: msg })),
        { role: 'user', content: message }
      ];

      const response = await this.client.chat.completions.create({
        model: this.assistantModel,
        messages: messages as any,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'I\'m sorry, I couldn\'t generate a response.';
    } catch (error) {
      console.error('Error generating OpenAI response:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  /**
   * Generate a reminder based on conversation context
   */
  async generateReminder(conversationHistory: string[]): Promise<{ content: string; scheduledTime: Date; } | null> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a helpful AI assistant analyzing a conversation to identify 
          if a reminder should be created. If you identify a need for a reminder, 
          extract the reminder content and the time it should be scheduled. 
          Return null if no reminder is needed.
          
          Format your response as a valid JSON object with 'content' and 'scheduledTime' properties.
          Example: { "content": "Take medication", "scheduledTime": "2023-06-01T09:00:00Z" }`
        },
        ...conversationHistory.map(msg => ({ role: 'user', content: msg }))
      ];

      const response = await this.client.chat.completions.create({
        model: this.assistantModel,
        messages: messages as any,
        max_tokens: 250,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) return null;
      
      try {
        const reminderData = JSON.parse(content);
        
        if (reminderData && reminderData.content && reminderData.scheduledTime) {
          return {
            content: reminderData.content,
            scheduledTime: new Date(reminderData.scheduledTime)
          };
        }
        
        return null;
      } catch (e) {
        console.error('Error parsing reminder JSON:', e);
        return null;
      }
    } catch (error) {
      console.error('Error generating reminder from OpenAI:', error);
      return null;
    }
  }

  /**
   * Analyze conversation to extract key information
   */
  async extractInformation(conversationHistory: string[]): Promise<Record<string, any>> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant that analyzes conversations to extract 
          key information that might be useful for the user's second brain. 
          Look for important dates, contacts, tasks, facts, or other information 
          that the user might want to remember. Return the extracted information 
          as a JSON object with appropriate categories.`
        },
        ...conversationHistory.map(msg => ({ role: 'user', content: msg }))
      ];

      const response = await this.client.chat.completions.create({
        model: this.assistantModel,
        messages: messages as any,
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) return {};
      
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error('Error parsing extracted information JSON:', e);
        return {};
      }
    } catch (error) {
      console.error('Error extracting information with OpenAI:', error);
      return {};
    }
  }
}

// Create a singleton instance
const openaiService = new OpenAIService();

export default openaiService;

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate text completion using OpenAI
 */
export const generateCompletion = async (prompt: string, model = 'gpt-4'): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    logger.error('OpenAI completion error:', error);
    throw new Error('Failed to generate text completion');
  }
};

/**
 * Summarize text using OpenAI
 */
export const summarizeText = async (text: string, model = 'gpt-4'): Promise<string> => {
  try {
    const prompt = `Please provide a concise summary of the following text:\n\n${text}`;
    
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    logger.error('OpenAI summarization error:', error);
    throw new Error('Failed to summarize text');
  }
};

/**
 * Extract key information from text
 */
export const extractKeyInfo = async (text: string, model = 'gpt-4'): Promise<Record<string, string>> => {
  try {
    const prompt = `
      Extract and structure the following key information from this text as JSON:
      - Main topics
      - Key points
      - Action items (if any)
      - Questions raised (if any)
      
      Text:
      ${text}
      
      Format your response as valid JSON with these fields.
    `;
    
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    logger.error('OpenAI key info extraction error:', error);
    throw new Error('Failed to extract key information');
  }
}; 