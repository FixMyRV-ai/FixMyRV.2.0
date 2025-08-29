import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
} from "class-validator";
import { DataTypes, Model, Sequelize, ModelCtor } from "sequelize";
export default function initMessageModel(sequelize: Sequelize): any {
  class Message extends Model {
    @IsNumber()
    id!: number;

    @IsNumber()
    @IsNotEmpty()
    chatId!: number;

    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsBoolean()
    @IsNotEmpty()
    is_bot!: boolean;

    @IsString()
    @IsOptional()
    smsMessageSid?: string; // Twilio SMS message SID for tracking

    @IsNumber()
    @IsOptional()
    smsBatchIndex?: number; // For tracking message parts in batched responses

    @IsNumber()
    @IsOptional()
    smsBatchTotal?: number; // Total parts in batched response

    @IsDate()
    @IsNotEmpty()
    createdAt!: Date;

    @IsDate()
    @IsNotEmpty()
    updatedAt!: Date;
  }
  Message.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      chatId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "chats",
          key: "id",
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_bot: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      smsMessageSid: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Twilio SMS message SID for tracking"
      },
      smsBatchIndex: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Index of message part in batched SMS response"
      },
      smsBatchTotal: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Total number of parts in batched SMS response"
      }
    },
    {
      sequelize,
      modelName: "Message",
      tableName: "messages",
      timestamps: true,
    }
  );
  return Message;
}
