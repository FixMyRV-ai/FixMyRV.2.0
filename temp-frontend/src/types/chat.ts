export interface Message {
  id?: number;
  chatId?: number;
  content: string;
  is_bot: boolean;
  timestamp: Date;
  createdAt?: Date;
}
export interface Chat {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  chat: Chat;
  messages: Message[];
}
