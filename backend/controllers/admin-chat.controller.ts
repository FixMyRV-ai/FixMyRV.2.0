import { Request, Response } from "express";
import { Chat, Message, OrganizationUser, Organization } from "../models/index.js";

interface AdminChatController {
  getSMSChats: (req: Request, res: Response) => Promise<void>;
}

/**
 * Get all SMS chats for admin view
 */
const getSMSChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const smsChats = await Chat.findAll({
      where: {
        channel: 'sms'
      },
      include: [
        {
          model: Message,
          as: 'messages',
          order: [['createdAt', 'ASC']],
          attributes: [
            'id', 
            'content', 
            'is_bot', 
            'createdAt', 
            'smsMessageSid',
            'smsBatchIndex', 
            'smsBatchTotal'
          ]
        },
        {
          model: OrganizationUser,
          as: 'organizationUser',
          attributes: ['id', 'firstName', 'lastName', 'phone'],
          include: [
            {
              model: Organization,
              as: 'organization',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 50 // Limit to recent conversations
    });

    res.json(smsChats);
  } catch (error: any) {
    console.error('Error fetching SMS chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SMS conversations',
      error: error?.message || 'Unknown error'
    });
  }
};

const adminChatController: AdminChatController = {
  getSMSChats
};

export default adminChatController;
