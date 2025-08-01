import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
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
