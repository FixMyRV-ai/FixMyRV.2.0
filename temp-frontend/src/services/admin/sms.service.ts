import BaseService from "../base.service";

interface SMSMessage {
  id: number;
  content: string;
  is_bot: boolean;
  createdAt: string;
  smsMessageSid?: string;
  smsBatchIndex?: number;
  smsBatchTotal?: number;
}

interface SMSChat {
  id: number;
  title: string;
  channel: 'sms';
  organizationUserId: number;
  createdAt: string;
  updatedAt: string;
  messages: SMSMessage[];
  organizationUser?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    organization: {
      name: string;
    };
  } | null;
}

export class AdminSMSService extends BaseService {
  constructor() {
    super("/admin");
  }

  /**
   * Get all SMS conversations for admin
   */
  async getSMSChats(): Promise<SMSChat[]> {
    const response = await this.get<{ success: boolean; data: SMSChat[]; count?: number }>("/sms-chats");
    return response.data || [];
  }

  /**
   * Get specific SMS conversation by ID
   */
  async getSMSChat(id: number): Promise<SMSChat> {
    return await this.get<SMSChat>(`/sms-chats/${id}`);
  }
}

export default new AdminSMSService();
