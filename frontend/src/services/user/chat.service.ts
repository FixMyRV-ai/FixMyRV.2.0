import type { Chat, Message } from "@/types/chat";
import BaseService from "@/services/base.service";
import { AxiosResponse } from "axios";
class ChatService extends BaseService {
  constructor() {
    super("/chats");
  }
  // Get all chats
  getAllChats = async (): Promise<Chat[]> => {
    return await this.get("/");
  };

  // Create a new chat
  createChat = async (title: string): Promise<Chat> => {
    const response = (await this.post(`/`, { title })) as AxiosResponse<Chat>;
    return response.data;
  };

  // Update chat title
  updateChatTitle = async (chatId: number, title: string): Promise<Chat> => {
    const response = (await this.put(`/${chatId}`, {
      title,
    })) as AxiosResponse<Chat>;
    return response.data;
  };

  // Get all messages for a chat
  getChatMessages = async (chatId: number): Promise<Message[]> => {
    const response = (await this.get(`/${chatId}/messages`)) as AxiosResponse<
      Message[]
    >;
    return response.data;
  };

  // Delete a chat
  deleteChat = async (chatId: number): Promise<void> => {
    await this.delete(`/${chatId}`);
  };
}

export default new ChatService();
