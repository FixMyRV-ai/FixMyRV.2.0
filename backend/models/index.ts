import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import initUserModel from "./user";
import initChatModel from "./chat";
import initMessageModel from "./message";
import initSettingmodel from "./setting";
import initSourceContentmodel from "./sourceContent";
import initTwilioSettingModel from "./twilioSetting";
import initTwilioLogModel from "./twilioLog";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: true,
    define: {
      timestamps: true,
    },
  }
);

const User = initUserModel(sequelize);
const Chat = initChatModel(sequelize);
const Message = initMessageModel(sequelize);
const Setting = initSettingmodel(sequelize);
const SourceContent = initSourceContentmodel(sequelize);
const TwilioSetting = initTwilioSettingModel(sequelize);
const TwilioLog = initTwilioLogModel(sequelize);

User.hasMany(Chat, {
  foreignKey: "userId",
  as: "chats",
});

Chat.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Chat.hasMany(Message, {
  foreignKey: "chatId",
  as: "messages",
});

Message.belongsTo(Chat, {
  foreignKey: "chatId",
  as: "chat",
});

export {
  sequelize,
  User,
  Chat,
  Message,
  Setting,
  SourceContent,
  TwilioSetting,
  TwilioLog,
};
export default sequelize;
