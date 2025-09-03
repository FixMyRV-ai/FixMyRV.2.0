import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import { ModelCtor, Model } from "sequelize";
import initUserModel from "./user.js";
import initChatModel from "./chat.js";
import initMessageModel from "./message.js";
import initSettingmodel from "./setting.js";
import initSourceContentmodel from "./sourceContent.js";
import initTwilioSettingModel from "./twilioSetting.js";
import initTwilioLogModel from "./twilioLog.js";
import initOrganizationModel from "./organization.js";
import initOrganizationUserModel from "./organizationUser.js";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string, 10),
    dialect: "postgres",
    logging: true,
    define: {
      timestamps: true,
    },
  }
);

const User: any = initUserModel(sequelize);
const Chat: any = initChatModel(sequelize);
const Message: any = initMessageModel(sequelize);
const Setting: any = initSettingmodel(sequelize);
const SourceContent: any = initSourceContentmodel(sequelize);
const TwilioSetting: any = initTwilioSettingModel(sequelize);
const TwilioLog: any = initTwilioLogModel(sequelize);
const Organization: any = initOrganizationModel(sequelize);
const OrganizationUser: any = initOrganizationUserModel(sequelize);

User.hasMany(Chat, {
  foreignKey: "userId",
  as: "chats",
});

Chat.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// OrganizationUser chat relationships for SMS
OrganizationUser.hasMany(Chat, {
  foreignKey: "organizationUserId",
  as: "chats",
});

Chat.belongsTo(OrganizationUser, {
  foreignKey: "organizationUserId",
  as: "organizationUser",
});

Chat.hasMany(Message, {
  foreignKey: "chatId",
  as: "messages",
});

Message.belongsTo(Chat, {
  foreignKey: "chatId",
  as: "chat",
});

// Organization relationships
Organization.hasMany(User, {
  foreignKey: "organizationId",
  as: "users",
});

User.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
});

// OrganizationUser relationships
Organization.hasMany(OrganizationUser, {
  foreignKey: "organizationId",
  as: "organizationUsers",
});

OrganizationUser.belongsTo(Organization, {
  foreignKey: "organizationId",
  as: "organization",
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
  Organization,
  OrganizationUser,
};
export default sequelize;
