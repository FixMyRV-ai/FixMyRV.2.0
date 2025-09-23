interface SmsMessageData {
    From: string;
    To: string;
    Body: string;
    MessageSid: string;
}
export declare class SmsChartService {
    private appService;
    /**
     * Process incoming SMS message and handle opt-in or chat conversation
     */
    processIncomingSMS(messageData: SmsMessageData): Promise<{
        success: boolean;
        message: string;
        responses?: string[];
    }>;
    /**
     * Check if message is an opt-in response
     */
    private isOptInResponse;
    /**
     * Check if message is a stop message
     */
    private isStopMessage;
    /**
     * Handle opt-in response from user
     */
    private handleOptInResponse;
    /**
     * Handle stop message from user
     */
    private handleStopMessage;
    /**
     * Process chat message and generate AI response
     */
    private processChatMessage;
    /**
     * Check if we should create a new chat (e.g., if last message is old)
     */
    private shouldCreateNewChat;
    /**
     * Generate AI response using the existing LangChain service
     */
    private generateAIResponse;
    /**
     * Split long messages into SMS-sized chunks (160 characters) - exposed for testing
     */
    splitMessageForSMS(message: string): string[];
    /**
     * Send SMS response using Twilio
     */
    sendSMSResponse(to: string, messages: string[]): Promise<void>;
}
declare const _default: SmsChartService;
export default _default;
//# sourceMappingURL=sms-chat.service.d.ts.map