import api from "../api";

export interface TwilioLogEntry {
  id: number;
  messageSid: string;
  accountSid: string;
  fromNumber: string;
  toNumber: string;
  messageBody: string;
  messageType: 'inbound' | 'outbound';
  status: 'received' | 'processed' | 'failed' | 'error';
  errorMessage?: string;
  numMedia: number;
  isTestMessage: boolean;
  processingTimeMs?: number;
  createdAt: string;
}

export interface TwilioLogsResponse {
  success: boolean;
  message: string;
  data: {
    logs: TwilioLogEntry[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

class TwilioService {
  /**
   * Fetch Twilio logs with pagination and filtering
   */
  async getLogs(params?: {
    limit?: number;
    offset?: number;
    isTest?: boolean;
    status?: string;
  }): Promise<TwilioLogsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.isTest !== undefined) queryParams.append('isTest', params.isTest.toString());
    if (params?.status) queryParams.append('status', params.status);

    const url = `/twilio/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Get recent logs for real-time viewing
   */
  async getRecentLogs(limit: number = 50): Promise<TwilioLogEntry[]> {
    const response = await this.getLogs({ limit, offset: 0 });
    return response.data.logs;
  }

  /**
   * Test the webhook with a sample message
   */
  async testWebhook(payload: {
    from?: string;
    to?: string;
    body?: string;
  }): Promise<any> {
    const response = await api.post('/twilio/test/sms', payload);
    return response.data;
  }

  /**
   * Get webhook status and configuration
   */
  async getWebhookStatus(): Promise<any> {
    const response = await api.get('/twilio/webhook/status');
    return response.data;
  }
}

const twilioService = new TwilioService();
export default twilioService;
