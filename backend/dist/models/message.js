var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString, IsOptional, } from "class-validator";
import { DataTypes, Model } from "sequelize";
export default function initMessageModel(sequelize) {
    class Message extends Model {
    }
    __decorate([
        IsNumber(),
        __metadata("design:type", Number)
    ], Message.prototype, "id", void 0);
    __decorate([
        IsNumber(),
        IsNotEmpty(),
        __metadata("design:type", Number)
    ], Message.prototype, "chatId", void 0);
    __decorate([
        IsString(),
        IsNotEmpty(),
        __metadata("design:type", String)
    ], Message.prototype, "content", void 0);
    __decorate([
        IsBoolean(),
        IsNotEmpty(),
        __metadata("design:type", Boolean)
    ], Message.prototype, "is_bot", void 0);
    __decorate([
        IsString(),
        IsOptional(),
        __metadata("design:type", String)
    ], Message.prototype, "smsMessageSid", void 0);
    __decorate([
        IsNumber(),
        IsOptional(),
        __metadata("design:type", Number)
    ], Message.prototype, "smsBatchIndex", void 0);
    __decorate([
        IsNumber(),
        IsOptional(),
        __metadata("design:type", Number)
    ], Message.prototype, "smsBatchTotal", void 0);
    __decorate([
        IsDate(),
        IsNotEmpty(),
        __metadata("design:type", Date)
    ], Message.prototype, "createdAt", void 0);
    __decorate([
        IsDate(),
        IsNotEmpty(),
        __metadata("design:type", Date)
    ], Message.prototype, "updatedAt", void 0);
    Message.init({
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
    }, {
        sequelize,
        modelName: "Message",
        tableName: "messages",
        timestamps: true,
    });
    return Message;
}
//# sourceMappingURL=message.js.map