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
    console.log("📱 Fetching SMS chats...");
    
    // First, check if tables exist
    try {
      const orgCount = await Organization.count();
      const userCount = await OrganizationUser.count();
      const chatCount = await Chat.count();
      
      console.log(`📊 Database status: ${orgCount} orgs, ${userCount} users, ${chatCount} chats`);
    } catch (tableError: any) {
      console.error("❌ Error checking tables:", tableError.message);
      res.status(500).json({
        success: false,
        message: 'Database tables not available - please check database setup',
        error: tableError.message,
        debug: {
          tablesChecked: ['organizations', 'organization_users', 'chats'],
          suggestion: 'Run database migrations or check table creation'
        }
      });
      return;
    }
    
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
          required: false, // Allow null organization users
          attributes: ['id', 'firstName', 'lastName', 'phone'],
          include: [
            {
              model: Organization,
              as: 'organization',
              required: false, // Allow null organizations
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 50 // Limit to recent conversations
    });

    console.log(`✅ Found ${smsChats.length} SMS chats`);
    
    // If no SMS chats found, return helpful message
    if (smsChats.length === 0) {
      res.json({
        success: true,
        data: [],
        message: 'No SMS conversations found yet',
        debug: {
          totalChats: await Chat.count(),
          smsChats: 0,
          webChats: await Chat.count({ where: { channel: 'web' } }),
          suggestion: 'SMS conversations will appear here after customers send messages'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: smsChats,
      count: smsChats.length
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching SMS chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SMS conversations',
      error: error?.message || 'Unknown error',
      debug: {
        errorType: error?.name || 'Unknown',
        stack: error?.stack?.split('\n').slice(0, 5) // First 5 lines of stack trace
      }
    });
  }
};

const adminChatController: AdminChatController = {
  getSMSChats
};

export default adminChatController;
