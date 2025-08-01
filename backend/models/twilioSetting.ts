import { DataTypes, Model, Sequelize, ModelCtor } from "sequelize";
import { IsString } from "class-validator";

export default function initTwilioSettingModel(sequelize: Sequelize): any {
  class TwilioSetting extends Model {
    @IsString()
    id!: number;

    @IsString()
    accountSid!: string;

    @IsString()
    authToken!: string;

    @IsString()
    phoneNumber!: string;
  }

  TwilioSetting.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      accountSid: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      authToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      phoneNumber: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "TwilioSetting",
      tableName: "twilio_settings",
      timestamps: true,
    }
  );
  return TwilioSetting;
}
