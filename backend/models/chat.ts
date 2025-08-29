import { DataTypes, Model, Sequelize, ModelCtor } from "sequelize";
import {
  IsNumber,
  IsString,
  Length,
  IsEnum,
  IsOptional,
} from "class-validator";

export default function initChatModel(sequelize: Sequelize): any {
  class Chat extends Model {
    @IsNumber()
    id!: number;

    @IsString()
    @Length(1, 255)
    userId!: string;

    @IsString()
    @Length(1, 255)
    title!: string;

    @IsEnum(["web", "sms"])
    channel!: "web" | "sms";

    @IsNumber()
    @IsOptional()
    organizationUserId?: number;

  }

  Chat.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Make nullable since SMS uses organizationUserId
        references: {
          model: "users",
          key: "id",
        },
      },
      organizationUserId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Make nullable since web uses userId
        references: {
          model: "organization_users",
          key: "id",
        },
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      channel: {
        type: DataTypes.ENUM("web", "sms"),
        allowNull: false,
        defaultValue: "web",
        validate: {
          isIn: [["web", "sms"]],
        },
      }
    },
    {
      sequelize,
      modelName: "Chat",
      tableName: "chats",
      timestamps: true,
    }
  );
  return Chat;
}
