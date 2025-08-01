import { DataTypes, Model, Sequelize, ModelCtor } from "sequelize";

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

export interface TwilioLogCreationAttributes extends Omit<TwilioLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class TwilioLog extends Model<TwilioLogAttributes, TwilioLogCreationAttributes> implements TwilioLogAttributes {
  public id!: number;
  public messageSid!: string;
  public accountSid!: string;
  public fromNumber!: string;
  public toNumber!: string;
  public messageBody!: string;
  public messageType!: 'inbound' | 'outbound';
  public status!: 'received' | 'processed' | 'failed' | 'error';
  public errorMessage?: string;
  public numMedia?: number;
  public webhookUrl?: string;
  public isTestMessage!: boolean;
  public processingTimeMs?: number;
  public rawPayload?: object;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

const initTwilioLogModel = (sequelize: Sequelize): any => {
  TwilioLog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      messageSid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Twilio Message SID (unique identifier)',
      },
      accountSid: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Twilio Account SID',
      },
      fromNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Phone number that sent the message',
      },
      toNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Phone number that received the message',
      },
      messageBody: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Content of the SMS message',
      },
      messageType: {
        type: DataTypes.ENUM('inbound', 'outbound'),
        allowNull: false,
        defaultValue: 'inbound',
        comment: 'Direction of the message',
      },
      status: {
        type: DataTypes.ENUM('received', 'processed', 'failed', 'error'),
        allowNull: false,
        defaultValue: 'received',
        comment: 'Processing status of the message',
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Error details if processing failed',
      },
      numMedia: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Number of media attachments',
      },
      webhookUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Webhook URL that received the message',
      },
      isTestMessage: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this was a test/simulated message',
      },
      processingTimeMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Time taken to process the message in milliseconds',
      },
      rawPayload: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Raw webhook payload from Twilio',
      },
    },
    {
      sequelize,
      tableName: "twilio_logs",
      timestamps: true,
      indexes: [
        {
          fields: ['messageSid'],
          unique: true,
        },
        {
          fields: ['accountSid'],
        },
        {
          fields: ['fromNumber'],
        },
        {
          fields: ['toNumber'],
        },
        {
          fields: ['messageType'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['createdAt'],
        },
        {
          fields: ['isTestMessage'],
        },
      ],
    }
  );

  return TwilioLog;
};

export default initTwilioLogModel;
