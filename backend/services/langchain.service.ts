import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
import { Setting } from "../models/index.js";

dotenv.config();

let instance = null;

// Initialize Gemini

export class AppService {
  async getChatTitle(message: string) {
    try {
      const systemPrompt = `Analyze the following message and generate a concise, meaningful title (maximum 6 words) that captures the essence of what the conversation will be about. The title should be descriptive but brief. Return only the title text, nothing else.

      For example:
      If message is "Can you help me build a weather app using React?" -> "React Weather App Development"
      If message is "Write a poem about sunset" -> "Sunset Poetry Creation"
      If message is "How do I implement authentication in Node.js?" -> "Node.js Authentication Implementation"`;
      
      const setting = await Setting.findOne();
      if (!setting || !setting.key) {
        throw new Error("API key is missing or not found");
      }

      const api_key = setting.key;
      const chat_model = setting.chatModel;
      
      const chat = new ChatOpenAI({
        apiKey:api_key,
        model: chat_model
      });
      const response = await chat.invoke([
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ]);

      return response.content;
    } catch (error) {
      console.error("Error getting chat title:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const appService = new AppService();
