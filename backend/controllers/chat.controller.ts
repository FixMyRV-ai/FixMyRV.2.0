import { Request, Response } from "express";
import { Chat, Message } from "../models/index.js";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "../types/user.js";
import { appService } from "../services/langchain.service.js";

class ChatController {
  async getAllChats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const chats = await Chat.findAll({
        where: { userId },
        order: [["updatedAt", "DESC"]],
      });
      res.json(chats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createChat(req: AuthenticatedRequest, res: Response) {
    try {
      const chatId = uuidv4();
      const { title } = req.body;
      const userId = req.user.id;

      const chatTitle = await appService.getChatTitle(title);
      const chat = await Chat.create({
        userId,
        title: chatTitle,
        chatId,
      });

      res
        .status(201)
        .json({ data: chat, message: "Chat created successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to create chat" });
    }
  }
  // Update chat title
  async updateChatTitle(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title } = req.body;
      const userId = req.user.id;

      const chat = await Chat.findOne({
        where: {
          id,
          userId,
        },
      });

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      chat.title = title;
      await chat.save();

      res.json({data:chat,"message":"Chat Title Updated successfully"});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get all messages for a chat
  async getChatMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const chat = await Chat.findOne({
        where: {
          id,
          userId,
        },
      });

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      const messages = await Message.findAll({
        where: {
          chatId: id,
        },
        order: [["createdAt", "ASC"]],
      });

      res.json({ data: messages, message: "Messages fetched successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete a chat
  async deleteChat(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const chat = await Chat.findOne({
        where: {
          id,
          userId,
        },
      });

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      await chat.destroy();

      res.json({ message: "Chat deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ChatController();
