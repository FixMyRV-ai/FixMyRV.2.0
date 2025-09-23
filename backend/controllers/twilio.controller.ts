import { Request, Response } from "express";
import { TwilioSetting, TwilioLog } from "../models/index.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import twilio from "twilio";

interface TwilioWebhookRequest extends Request {
  body: {
    MessageSid: string;
    AccountSid: string;
    From: string;
    To: string;
    Body: string;
    NumMedia?: string;
    [key: string]: any;
  };
  headers: {
    'x-twilio-signature'?: string;
    [key: string]: any;
  };
}

interface TwilioWebhookResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

interface TwilioGeographicData {
  fromCity?: string;
  fromState?: string;
  fromZip?: string;
  fromCountry?: string;
  toCity?: string;
  toState?: string;
  toZip?: string;
  toCountry?: string;
  smsStatus?: string;
  numSegments?: string;
  apiVersion?: string;
}

/**
 * Logs Twilio webhook to database and file with enhanced geographic data
 */
const logTwilioWebhook = async (
  messageSid: string,
  accountSid: string,
  fromNumber: string,
  toNumber: string,
  messageBody: string,
  numMedia: number = 0,
  webhookUrl: string,
  isTestMessage: boolean = false,
  status: 'received' | 'processed' | 'failed' | 'error' = 'received',
  errorMessage?: string,
  processingTimeMs?: number,
  rawPayload?: object
): Promise<void> => {
  try {
    // Extract geographic data from rawPayload if available
    let geographicData: TwilioGeographicData = {};
    if (rawPayload && typeof rawPayload === 'object') {
      const payload = rawPayload as any;
      geographicData = {
        fromCity: payload.FromCity || payload.fromCity,
        fromState: payload.FromState || payload.fromState,
        fromZip: payload.FromZip || payload.fromZip,
        fromCountry: payload.FromCountry || payload.fromCountry,
        toCity: payload.ToCity || payload.toCity,
        toState: payload.ToState || payload.toState,
        toZip: payload.ToZip || payload.toZip,
        toCountry: payload.ToCountry || payload.toCountry,
        smsStatus: payload.SmsStatus || payload.smsStatus,
        numSegments: payload.NumSegments || payload.numSegments,
        apiVersion: payload.ApiVersion || payload.apiVersion
      };
    }

    // Database logging
    await TwilioLog.create({
      messageSid,
      accountSid,
      fromNumber,
      toNumber,
      messageBody,
      messageType: 'inbound',
      status,
      errorMessage,
      numMedia,
      webhookUrl,
      isTestMessage,
      processingTimeMs,
      rawPayload,
    });

    // Enhanced file logging with geographic data
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      messageSid,
      accountSid,
      from: fromNumber,
      to: toNumber,
      body: messageBody,
      status,
      isTest: isTestMessage,
      processingTimeMs,
      error: errorMessage,
      // Enhanced geographic logging
      location: {
        from: {
          city: geographicData.fromCity,
          state: geographicData.fromState,
          zip: geographicData.fromZip,
          country: geographicData.fromCountry
        },
        to: {
          city: geographicData.toCity,
          state: geographicData.toState,
          zip: geographicData.toZip,
          country: geographicData.toCountry
        }
      },
      metadata: {
        smsStatus: geographicData.smsStatus,
        numSegments: geographicData.numSegments,
        apiVersion: geographicData.apiVersion,
        numMedia
      }
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    const logFile = path.join(logDir, `twilio-${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFileSync(logFile, logLine);

    console.log('📝 Twilio webhook logged:', {
      messageSid,
      status,
      isTest: isTestMessage,
      processingTime: processingTimeMs ? `${processingTimeMs}ms` : 'N/A',
      location: geographicData.fromCity && geographicData.fromState ? 
        `${geographicData.fromCity}, ${geographicData.fromState}` : 'Unknown'
    });

  } catch (error) {
    console.error('❌ Failed to log Twilio webhook:', error);
    // Don't throw error - logging failure shouldn't break webhook processing
  }
};

/**
 * Validates Twilio webhook signature
 * @param authToken - Twilio auth token from settings
 * @param signature - X-Twilio-Signature header value
 * @param url - The full webhook URL
 * @param params - The webhook parameters
 * @returns boolean indicating if signature is valid
 */
const getExternalRequestUrl = (req: Request): string => {
  // Prefer proxy headers set by Railway/ingress
  const xfProto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const xfHost = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
  // Avoid adding default ports; Twilio signs without :443
  return `${xfProto}://${xfHost}${req.originalUrl}`;
};

/**
 * Receives incoming Twilio SMS webhook
 * POST /api/v1/twilio/webhook/sms
 */
export const receiveSmsWebhook = async (
  req: TwilioWebhookRequest,
  res: Response<TwilioWebhookResponse>
): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { MessageSid, AccountSid, From, To, Body, NumMedia } = req.body;
    const twilioSignature = req.headers['x-twilio-signature'];
    const webhookUrl = getExternalRequestUrl(req);

    console.log('📱 Incoming Twilio SMS webhook:', {
      MessageSid,
      AccountSid,
      From,
      To,
      Body: Body?.substring(0, 100) + (Body?.length > 100 ? '...' : ''),
      NumMedia
    });

    // Get Twilio settings from database
    const twilioSettings = await TwilioSetting.findOne();
    
    if (!twilioSettings) {
      const errorMsg = 'Twilio settings not configured';
      console.error('❌ No Twilio settings found in database');
      
      // Log the failed attempt
      await logTwilioWebhook(
        MessageSid,
        AccountSid,
        From,
        To,
        Body,
        NumMedia ? parseInt(NumMedia) : 0,
        webhookUrl,
        false,
        'error',
        errorMsg,
        Date.now() - startTime,
        req.body
      );
      
      res.status(500).json({
        success: false,
        message: errorMsg,
        error: 'No Twilio configuration found'
      });
      return;
    }

    // Validate AccountSid matches our settings
    if (AccountSid !== twilioSettings.accountSid) {
      const errorMsg = 'AccountSid does not match configured settings';
      console.error('❌ AccountSid mismatch:', {
        received: AccountSid,
        expected: twilioSettings.accountSid
      });
      
      // Log the failed attempt
      await logTwilioWebhook(
        MessageSid,
        AccountSid,
        From,
        To,
        Body,
        NumMedia ? parseInt(NumMedia) : 0,
        webhookUrl,
        false,
        'failed',
        errorMsg,
        Date.now() - startTime,
        req.body
      );
      
      res.status(403).json({
        success: false,
        message: 'Invalid AccountSid',
        error: errorMsg
      });
      return;
    }

    // Validate Twilio signature (can be skipped with SKIP_TWILIO_SIGNATURE=true)
    if (
      twilioSignature &&
      process.env.NODE_ENV === 'production' &&
      process.env.SKIP_TWILIO_SIGNATURE !== 'true'
    ) {
      const isValidSignature = twilio.validateRequest(
        twilioSettings.authToken,
        twilioSignature,
        webhookUrl,
        req.body as any
      );

      if (!isValidSignature) {
        const errorMsg = 'Twilio signature validation failed';
        console.error('❌ Invalid Twilio signature');
        
        // Log the failed attempt
        await logTwilioWebhook(
          MessageSid,
          AccountSid,
          From,
          To,
          Body,
          NumMedia ? parseInt(NumMedia) : 0,
          webhookUrl,
          false,
          'failed',
          errorMsg,
          Date.now() - startTime,
          req.body
        );
        
        res.status(403).json({
          success: false,
          message: 'Invalid signature',
          error: errorMsg
        });
        return;
      }
    } else if (!twilioSignature) {
      console.warn('⚠️  No Twilio signature provided (development/manual test).');
    } else if (process.env.SKIP_TWILIO_SIGNATURE === 'true') {
      console.warn('⚠️  SKIP_TWILIO_SIGNATURE=true — bypassing signature validation.');
    }

    // Process SMS through SMS Chat Service
    console.log('🔄 Processing SMS message through chat service...');
    let chatResult;
    try {
      const smsService = (await import('../services/sms-chat.service')).default;
      
      chatResult = await smsService.processIncomingSMS({
        From,
        To,
        Body,
        MessageSid
      });
      console.log('✅ SMS Service Result:', chatResult);
      
      if (chatResult.success && chatResult.responses) {
        console.log('📤 Sending AI response via SMS...');
        // Send response messages back via SMS
        await smsService.sendSMSResponse(From, chatResult.responses);
        console.log('✅ AI response sent successfully');
      } else {
        console.log('ℹ️ No response needed:', chatResult.message);
      }
    } catch (smsError) {
      console.error('❌ SMS Service Error:', smsError);
      // Continue with basic logging even if SMS service fails
      chatResult = { success: false, message: 'SMS service failed' };
    }

    const processingTime = Date.now() - startTime;

    // Log successful processing
    await logTwilioWebhook(
      MessageSid,
      AccountSid,
      From,
      To,
      Body,
      NumMedia ? parseInt(NumMedia) : 0,
      webhookUrl,
      false,
      'processed',
      undefined,
      processingTime,
      req.body
    );

    console.log('✅ SMS processed successfully in', processingTime, 'ms');

    // Respond to Twilio (empty response means "message received")
    res.status(200).json({
      success: true,
      message: 'SMS received and processed',
      data: {
        messageSid: MessageSid,
        processed: true,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ Error processing Twilio SMS webhook:', error);
    
    // Try to log the error (use fallback values if request data is unavailable)
    try {
      await logTwilioWebhook(
        req.body?.MessageSid || 'UNKNOWN',
        req.body?.AccountSid || 'UNKNOWN',
        req.body?.From || 'UNKNOWN',
        req.body?.To || 'UNKNOWN',
        req.body?.Body || '',
        req.body?.NumMedia ? parseInt(req.body.NumMedia) : 0,
        getExternalRequestUrl(req as unknown as Request),
        false,
        'error',
        errorMessage,
        processingTime,
        req.body
      );
    } catch (logError) {
      console.error('❌ Failed to log error:', logError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: errorMessage
    });
  }
};

/**
 * Test endpoint for simulating Twilio webhooks locally
 * POST /api/v1/twilio/test/sms
 */
export const testSmsWebhook = async (
  req: Request,
  res: Response<TwilioWebhookResponse>
): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Support both simplified format (from, to, body) and full Twilio format
    const isFullFormat = req.body.MessageSid || req.body.SmsMessageSid;
    
    let messageData;
    if (isFullFormat) {
      // Handle full Twilio webhook format
      messageData = {
        MessageSid: req.body.MessageSid || req.body.SmsMessageSid,
        AccountSid: req.body.AccountSid,
        From: req.body.From,
        To: req.body.To,
        Body: req.body.Body,
        NumMedia: req.body.NumMedia || '0',
        FromCity: req.body.FromCity,
        FromState: req.body.FromState,
        FromZip: req.body.FromZip,
        FromCountry: req.body.FromCountry,
        ToCity: req.body.ToCity,
        ToState: req.body.ToState,
        ToZip: req.body.ToZip,
        ToCountry: req.body.ToCountry,
        SmsStatus: req.body.SmsStatus || 'received'
      };
    } else {
      // Handle simplified format for backward compatibility
      const { from, to, body } = req.body;

      // Get Twilio settings to use in simulation
      const twilioSettings = await TwilioSetting.findOne();
      
      if (!twilioSettings) {
        res.status(500).json({
          success: false,
          message: 'Twilio settings not configured',
          error: 'Please configure Twilio settings in admin panel first'
        });
        return;
      }

      // Create a simulated webhook payload for simplified format
      messageData = {
        MessageSid: `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        AccountSid: twilioSettings.accountSid,
        From: from || '+1234567890',
        To: to || twilioSettings.phoneNumber,
        Body: body || 'Test message from local simulator',
        NumMedia: '0'
      };
    }

    console.log('🧪 Simulating Twilio webhook:', messageData);

    const webhookUrl = `${req.protocol}://${req.get('host')}/api/v1/twilio/test/sms`;
    const processingTime = Date.now() - startTime;

    // Log the test message
    await logTwilioWebhook(
      messageData.MessageSid,
      messageData.AccountSid,
      messageData.From,
      messageData.To,
      messageData.Body,
      parseInt(messageData.NumMedia) || 0,
      webhookUrl,
      true, // This is a test message
      'processed',
      undefined,
      processingTime,
      messageData
    );

    res.status(200).json({
      success: true,
      message: 'Test SMS simulated and logged',
      data: {
        messageSid: messageData.MessageSid,
        processed: true,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        isTest: true,
        format: isFullFormat ? 'full-twilio' : 'simplified'
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ Error in test SMS webhook:', error);
    
    // Try to log the test error
    try {
      await logTwilioWebhook(
        'TEST_ERROR',
        'TEST_ACCOUNT',
        req.body?.From || req.body?.from || 'UNKNOWN',
        req.body?.To || req.body?.to || 'UNKNOWN',
        req.body?.Body || req.body?.body || 'Test message failed',
        0,
        `${req.protocol}://${req.get('host')}/api/v1/twilio/test/sms`,
        true,
        'error',
        errorMessage,
        processingTime,
        req.body
      );
    } catch (logError) {
      console.error('❌ Failed to log test error:', logError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Test webhook failed',
      error: errorMessage
    });
  }
};

/**
 * Get webhook status and configuration info
 * GET /api/v1/twilio/webhook/status
 */
export const getWebhookStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const twilioSettings = await TwilioSetting.findOne();
    
    if (!twilioSettings) {
      res.status(200).json({
        success: false,
        message: 'Twilio not configured',
        webhookUrl: `${req.protocol}://${req.get('host')}/api/v1/twilio/webhook/sms`,
        configured: false
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Twilio webhook ready',
      webhookUrl: `${req.protocol}://${req.get('host')}/api/v1/twilio/webhook/sms`,
      testUrl: `${req.protocol}://${req.get('host')}/api/v1/twilio/test/sms`,
      logsUrl: `${req.protocol}://${req.get('host')}/api/v1/twilio/logs`,
      configured: true,
      settings: {
        accountSid: twilioSettings.accountSid,
        phoneNumber: twilioSettings.phoneNumber,
        hasAuthToken: !!twilioSettings.authToken
      }
    });

  } catch (error) {
    console.error('❌ Error getting webhook status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking webhook status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get Twilio webhook logs
 * GET /api/v1/twilio/logs?limit=50&offset=0&isTest=false
 */
export const getTwilioLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const isTest = req.query.isTest === 'true' ? true : req.query.isTest === 'false' ? false : undefined;
    const status = req.query.status as string;

    const where: any = {};
    if (isTest !== undefined) where.isTestMessage = isTest;
    if (status) where.status = status;

    const logs = await TwilioLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id',
        'messageSid',
        'accountSid',
        'fromNumber',
        'toNumber',
        'messageBody',
        'messageType',
        'status',
        'errorMessage',
        'numMedia',
        'isTestMessage',
        'processingTimeMs',
        'createdAt'
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Twilio logs retrieved',
      data: {
        logs: logs.rows,
        total: logs.count,
        limit,
        offset,
        hasMore: offset + limit < logs.count
      }
    });

  } catch (error) {
    console.error('❌ Error getting Twilio logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
