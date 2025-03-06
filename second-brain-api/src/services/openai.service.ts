import OpenAI from 'openai';
import env from '../config/env';

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