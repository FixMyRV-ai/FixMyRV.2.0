import { DataTypes, Model, Sequelize } from "sequelize";
import {
  IsNumber,
  IsString,
  Length,
} from "class-validator";

export default function initChatModel(sequelize: Sequelize) {
  class Chat extends Model {
    @IsNumber()
    id!: number;

    @IsString()
    @Length(1, 255)
    userId!: string;

    @IsString()
    @Length(1, 255)
    title!: string;

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
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
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
