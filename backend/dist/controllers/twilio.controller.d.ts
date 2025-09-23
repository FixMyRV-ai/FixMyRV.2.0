import { Request, Response } from "express";
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
/**
 * Receives incoming Twilio SMS webhook
 * POST /api/v1/twilio/webhook/sms
 */
export declare const receiveSmsWebhook: (req: TwilioWebhookRequest, res: Response<TwilioWebhookResponse>) => Promise<void>;
/**
 * Test endpoint for simulating Twilio webhooks locally
 * POST /api/v1/twilio/test/sms
 */
export declare const testSmsWebhook: (req: Request, res: Response<TwilioWebhookResponse>) => Promise<void>;
/**
 * Get webhook status and configuration info
 * GET /api/v1/twilio/webhook/status
 */
export declare const getWebhookStatus: (req: Request, res: Response) => Promise<void>;
/**
 * Get Twilio webhook logs
 * GET /api/v1/twilio/logs?limit=50&offset=0&isTest=false
 */
export declare const getTwilioLogs: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=twilio.controller.d.ts.map