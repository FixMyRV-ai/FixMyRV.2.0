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

    @IsString()
    optinMessage!: string;
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
      optinMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: 'Your Phone Number has been associated with a FixMyRV.ai service account. To confirm and Opt-In, please respond "YES" to this message. At any moment you can stop all messages from us, by texting back "STOP".',
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
