import { DataTypes, Model, Sequelize } from "sequelize";
import { IsNumber, IsString } from "class-validator";

export default function initSettingmodel(sequelize: Sequelize) {
  class Setting extends Model {
    @IsNumber()
    id!: number;

    @IsString()
    key!: string;

    @IsString()
    chatModel!: string;

    @IsString()
    embeddingModel!: string;

    @IsNumber()
    outputTokens!: number;

    @IsString()
    systemPrompt!: string;
  }

  Setting.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      chatModel: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      embeddingModel: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      systemPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "You are a helpful AI assistant."
    },
      outputTokens: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Setting",
      tableName: "settings",
      timestamps: true,
    }
  );
  return Setting;
}
