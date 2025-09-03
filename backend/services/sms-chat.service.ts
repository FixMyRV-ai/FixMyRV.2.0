import { Chat, Message, OrganizationUser, TwilioSetting } from '../models/index.js';
import { AppService } from './langchain.service.js';
import { getVectorStore } from '../config/database.js';
import { ChatOpenAI } from "@langchain/openai";
import { Setting } from '../models/index.js';
const twilio = require('twilio'); // Use require instead of import

interface SmsMessageData {
  From: string;
  To: string;
  Body: string;
  MessageSid: string;
}

export class SmsChartService {
  private appService = new AppService();

  /**
   * Process incoming SMS message and handle opt-in or chat conversation
   */
  async processIncomingSMS(messageData: SmsMessageData): Promise<{
    success: boolean;
    message: string;
    responses?: string[];
  }> {
    try {
      const { From, To, Body, MessageSid } = messageData;
      
      // Find the organization user by phone number
      const orgUser = await OrganizationUser.findOne({
        where: { phone: From },
        include: [{
          model: require('../models/index').Organization,
          as: 'organization'
        }]
      });

      if (!orgUser) {
        console.log(`No organization user found for phone: ${From}`);
        return {
          success: false,
          message: 'Phone number not registered with any organization'
        };
      }

      // Check if this is an opt-in response
      if (this.isOptInResponse(Body)) {
        return await this.handleOptInResponse(orgUser, MessageSid);
      }

      // Check if user is opted in (status should be 'active')
      if (orgUser.status !== 'active') {
        console.log(`User ${orgUser.firstName} ${orgUser.lastName} not opted in. Status: ${orgUser.status}`);
        return {
          success: false,
          message: 'User must opt-in first by responding YES to invitation'
        };
      }

      // Check for STOP messages
      if (this.isStopMessage(Body)) {
        return await this.handleStopMessage(orgUser);
      }

      // Process chat message
      return await this.processChatMessage(orgUser, Body, MessageSid);

    } catch (error) {
      console.error('Error processing SMS:', error);
      return {
        success: false,
        message: 'Error processing SMS message'
      };
    }
  }

  /**
   * Check if message is an opt-in response
   */
  private isOptInResponse(message: string): boolean {
    const cleanMessage = message.trim().toLowerCase();
    return ['yes', 'y', 'ok', 'okay', 'confirm', 'opt in', 'optin'].includes(cleanMessage);
  }

  /**
   * Check if message is a stop message
   */
  private isStopMessage(message: string): boolean {
    const cleanMessage = message.trim().toLowerCase();
    return ['stop', 'unsubscribe', 'quit', 'cancel', 'end'].includes(cleanMessage);
  }

  /**
   * Handle opt-in response from user
   */
  private async handleOptInResponse(orgUser: any, messageSid: string): Promise<{
    success: boolean;
    message: string;
    responses: string[];
  }> {
    try {
      // Update user status to active
      await orgUser.update({ status: 'active' });

      console.log(`User ${orgUser.firstName} ${orgUser.lastName} opted in successfully`);

      const welcomeMessage = `Welcome to FixMyRV.ai, ${orgUser.firstName}! 🚐

You're now connected to our AI assistant. Ask me anything about RV maintenance, repairs, or troubleshooting.

Examples:
• "My generator won't start"
• "Water pump issues"  
• "Electrical problems"

How can I help you today?`;

      return {
        success: true,
        message: 'User opted in successfully',
        responses: this.splitMessageForSMS(welcomeMessage)
      };

    } catch (error) {
      console.error('Error handling opt-in:', error);
      throw error;
    }
  }

  /**
   * Handle stop message from user
   */
  private async handleStopMessage(orgUser: any): Promise<{
    success: boolean;
    message: string;
    responses: string[];
  }> {
    try {
      // Update user status to inactive
      await orgUser.update({ status: 'inactive' });

      console.log(`User ${orgUser.firstName} ${orgUser.lastName} opted out`);

      return {
        success: true,
        message: 'User opted out successfully',
        responses: ['You have been unsubscribed from FixMyRV.ai SMS. Reply YES to opt back in.']
      };

    } catch (error) {
      console.error('Error handling stop message:', error);
      throw error;
    }
  }

  /**
   * Process chat message and generate AI response
   */
  private async processChatMessage(orgUser: any, message: string, messageSid: string): Promise<{
    success: boolean;
    message: string;
    responses: string[];
  }> {
    try {
      // Find or create active chat for this user
      let chat = await Chat.findOne({
        where: {
          organizationUserId: orgUser.id,
          channel: 'sms'
        },
        order: [['updatedAt', 'DESC']],
        include: [{
          model: Message,
          as: 'messages',
          order: [['createdAt', 'ASC']],
          limit: 10 // Get last 10 messages for context
        }]
      });

      // Create new chat if none exists or if last chat is old (24 hours)
      if (!chat || this.shouldCreateNewChat(chat)) {
        const chatTitle = await this.appService.getChatTitle(message);
        chat = await Chat.create({
          organizationUserId: orgUser.id,
          title: chatTitle,
          channel: 'sms'
        });
        console.log(`Created new SMS chat: ${chatTitle}`);
      }

      // Save user message
      await Message.create({
        chatId: chat.id,
        content: message,
        is_bot: false,
        smsMessageSid: messageSid
      });

      // Generate AI response
      const aiResponse = await this.generateAIResponse(chat.id, message);

      // Split response into SMS-sized chunks
      const responseChunks = this.splitMessageForSMS(aiResponse);

      // Save AI response messages
      for (let i = 0; i < responseChunks.length; i++) {
        await Message.create({
          chatId: chat.id,
          content: responseChunks[i],
          is_bot: true,
          smsBatchIndex: i + 1,
          smsBatchTotal: responseChunks.length
        });
      }

      return {
        success: true,
        message: 'Chat message processed successfully',
        responses: responseChunks
      };

    } catch (error) {
      console.error('Error processing chat message:', error);
      throw error;
    }
  }

  /**
   * Check if we should create a new chat (e.g., if last message is old)
   */
  private shouldCreateNewChat(chat: any): boolean {
    if (!chat.updatedAt) return true;
    
    const lastUpdate = new Date(chat.updatedAt);
    const now = new Date();
    const hoursSinceLastMessage = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    // Create new chat if last activity was more than 24 hours ago
    return hoursSinceLastMessage > 24;
  }

  /**
   * Generate AI response using the existing LangChain service
   */
  private async generateAIResponse(chatId: number, message: string): Promise<string> {
    try {
      // Get chat history for context
      const chatHistory = await Message.findAll({
        where: { chatId },
        order: [['createdAt', 'ASC']],
        limit: 20 // Last 20 messages for context
      });

      // Format chat history for AI
      const formattedHistory = chatHistory.map((msg: any) => ({
        role: msg.is_bot ? "assistant" : "user",
        content: msg.content,
      }));

      // Get AI settings
      const setting = await Setting.findOne();
      if (!setting || !setting.key) {
        throw new Error("AI API key not configured");
      }

      // Get relevant documents from vector store
      const vectorStore = await getVectorStore();
      const relevantDocs = await vectorStore.similaritySearch(message, 3);
      const context = relevantDocs.map((doc: any) => doc.pageContent).join("\n\n");

      // Initialize OpenAI chat
      const chat = new ChatOpenAI({
        apiKey: setting.key,
        model: setting.chatModel,
        streaming: false, // No streaming for SMS
        temperature: 0.7
      });

      // Create SMS-optimized system prompt
      const smsSystemPrompt = `${setting.systemPrompt}

IMPORTANT SMS FORMATTING RULES:
- Keep responses concise and helpful
- Use simple language 
- Include specific steps when possible
- Use bullet points (•) or numbers for lists
- Focus on immediate actionable advice
- If response is long, prioritize the most important information

Context from knowledge base:
${context}`;

      // Get AI response
      const response = await chat.invoke([
        { role: "system", content: smsSystemPrompt },
        ...formattedHistory,
        { role: "user", content: message }
      ]);

      return response.content as string;

    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm sorry, I encountered an error processing your request. Please try again later.";
    }
  }

  /**
   * Split long messages into SMS-sized chunks (160 characters) - exposed for testing
   */
  splitMessageForSMS(message: string): string[] {
    const maxLength = 150; // Leave room for part numbers if needed
    const chunks: string[] = [];

    if (message.length <= maxLength) {
      return [message];
    }

    // Try to split at sentence boundaries first
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let currentChunk = '';

    for (let sentence of sentences) {
      sentence = sentence.trim();
      if (!sentence) continue;

      // If single sentence is too long, split it at word boundaries
      if (sentence.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim() + '.');
          currentChunk = '';
        }
        
        const words = sentence.split(' ');
        let wordChunk = '';
        
        for (const word of words) {
          if ((wordChunk + ' ' + word).length <= maxLength) {
            wordChunk += (wordChunk ? ' ' : '') + word;
          } else {
            if (wordChunk) {
              chunks.push(wordChunk.trim() + '...');
              wordChunk = word;
            } else {
              // Single word is too long, force split
              chunks.push(word.substring(0, maxLength - 3) + '...');
            }
          }
        }
        
        if (wordChunk) {
          currentChunk = wordChunk;
        }
      } else {
        // Check if adding this sentence would exceed limit
        const testChunk = currentChunk + (currentChunk ? '. ' : '') + sentence;
        
        if (testChunk.length <= maxLength) {
          currentChunk = testChunk;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk.trim() + '.');
          }
          currentChunk = sentence;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim() + (currentChunk.endsWith('.') ? '' : '.'));
    }

    // Add part numbers if multiple chunks
    if (chunks.length > 1) {
      return chunks.map((chunk, index) => 
        `(${index + 1}/${chunks.length}) ${chunk}`
      );
    }

    return chunks;
  }

  /**
   * Send SMS response using Twilio
   */
  async sendSMSResponse(to: string, messages: string[]): Promise<void> {
    try {
      const twilioSettings = await TwilioSetting.findOne();
      if (!twilioSettings) {
        throw new Error('Twilio settings not configured');
      }

      const client = twilio(twilioSettings.accountSid, twilioSettings.authToken);

      // Send each message with a small delay to ensure proper ordering
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        
        await client.messages.create({
          body: message,
          from: twilioSettings.phoneNumber,
          to: to
        });

        console.log(`Sent SMS part ${i + 1}/${messages.length} to ${to}`);

        // Small delay between messages to ensure ordering
        if (i < messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

    } catch (error) {
      console.error('Error sending SMS response:', error);
      throw error;
    }
  }
}

export default new SmsChartService();
