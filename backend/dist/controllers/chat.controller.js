import { Chat, Message } from "../models/index.js";
import { v4 as uuidv4 } from "uuid";
import { appService } from "../services/langchain.service.js";
class ChatController {
    async getAllChats(req, res) {
        try {
            const userId = req.user.id;
            const chats = await Chat.findAll({
                where: { userId },
                order: [["updatedAt", "DESC"]],
            });
            res.json(chats);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createChat(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ error: "Failed to create chat" });
        }
    }
    // Update chat title
    async updateChatTitle(req, res) {
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
            res.json({ data: chat, "message": "Chat Title Updated successfully" });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Get all messages for a chat
    async getChatMessages(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Delete a chat
    async deleteChat(req, res) {
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
export default new ChatController();
//# sourceMappingURL=chat.controller.js.map