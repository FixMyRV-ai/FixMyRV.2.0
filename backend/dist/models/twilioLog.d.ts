import { Sequelize } from "sequelize";
export interface TwilioLogAttributes {
    id?: number;
    messageSid: string;
    accountSid: string;
    fromNumber: string;
    toNumber: string;
    messageBody: string;
    messageType: 'inbound' | 'outbound';
    status: 'received' | 'processed' | 'failed' | 'error';
    errorMessage?: string;
    numMedia?: number;
    webhookUrl?: string;
    isTestMessage: boolean;
    processingTimeMs?: number;
    rawPayload?: object;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface TwilioLogCreationAttributes extends Omit<TwilioLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare const initTwilioLogModel: (sequelize: Sequelize) => any;
export default initTwilioLogModel;
//# sourceMappingURL=twilioLog.d.ts.map