import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Request, Response } from "express";
import dotenv from "dotenv";
import { Setting, Message, User } from "../models/index";
import { AuthenticatedRequest } from "../types/user";
import { getVectorStore } from "../config/database";
dotenv.config();

class OpenaiController {
  constructor() {
    this.chat = this.chat.bind(this);
  }

  async chat(req: Request, res: Response) {
    try {
      const userId = (req as unknown as AuthenticatedRequest).user.id;
      const { message, chatId } = req.body;
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error("User not found");
      }

      if (user.credits <= 0) {
        throw new Error("Insufficient credits");
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");

      if (!message) {
        throw new Error("Message is required");
      }

      const setting = await Setting.findOne();
      if (!setting || !setting.key) {
        throw new Error("API key is missing or not found");
      }

      const api_key = setting.key;
      const chat_model = setting.chatModel;

      await Message.create({
        content: message,
        chatId: chatId,
        is_bot: false,
        timestamp: new Date().toISOString(),
      });

      // Get chat history
      const chatHistory = await Message.findAll({
        where: {
          chatId: chatId,
        },
        order: [["createdAt", "ASC"]],
        limit: 50,
      });

      // Format chat history for context with proper role attribution
      const formattedHistory = chatHistory.map((msg: any) => ({
        role: msg.is_bot ? "assistant" : "user",
        content: msg.content,
      }));

      // Get vector store instance
      const vectorStore = await getVectorStore();

      // Get relevant documents
      const relevantDocs = await vectorStore.similaritySearch(message, 3);

      // Create context from relevant documents
      const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

      // Initialize OpenAI chat
      const chat = new ChatOpenAI({
        apiKey: api_key,
        model: chat_model,
        streaming: true,
      });

      // Stream the response with context
      const stream = await chat.stream([
        {
          role: "system",
          content: `${setting.systemPrompt}:\n\n${context}`,
        },
        ...formattedHistory,
        { role: "user", content: message },
      ]);
      let fullContent = "";
      let totalTokens = 0;

      for await (const chunk of stream) {
        const content = chunk.content || "";
        if (content) {
          fullContent += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }

        // Accumulate tokens instead of deducting on each chunk
        totalTokens += chunk?.usage_metadata?.total_tokens || 0;
      }

      // Deduct credits once at the end of streaming
      await this.deductUserCredits(userId as unknown as string, totalTokens);

      res.write("data: [DONE]\n\n");
      await Message.create({
        content: fullContent,
        chatId: chatId,
        is_bot: true,
        timestamp: new Date().toISOString(),
      });
      // End the stream
      res.end();
    } catch (error: any) {
      console.error("Chat Error:", error);
      const errorMessage = {
        error: true,
        message:
          error.message || "An error occurred while processing your request",
      };
      res.write(`data: ${JSON.stringify(errorMessage)}\n\n`);
      res.end();
    }
  }

  // Centralized function to handle credit deduction
  async deductUserCredits(userId: string, total_tokens: any) {
    if (!userId) {
      console.log("No userId provided, skipping credit deduction");
      return { success: false, reason: "No userId provided" };
    }

    try {
      // Get the user
      const user = await User.findByPk(userId);
      if (!user) {
        console.log(`User ${userId} not found`);
        return { success: false, reason: "User not found" };
      }

      if (total_tokens <= 0) {
        console.log("No credits to deduct");
        return {
          success: true,
          creditsDeducted: 0,
          creditsRemaining: user.credits,
        };
      }

      // Check if user has enough credits
      if (user.credits > total_tokens) {
        user.credits -= total_tokens;
      } else {
        user.credits = 0;
      }
      // Deduct credits
      await user.save();

      console.log(
        `Successfully deducted ${total_tokens} credits. User now has ${user.credits} credits.`
      );
      return {
        success: true,
        creditsDeducted: total_tokens,
        creditsRemaining: user.credits,
      };
    } catch (error: any) {
      console.error("Error deducting user credits:", error);
      return {
        success: false,
        reason: "Error deducting credits",
        error: error.message,
      };
    }
  }
}

export default new OpenaiController();
