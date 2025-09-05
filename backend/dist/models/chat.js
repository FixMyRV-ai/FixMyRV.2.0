var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { DataTypes, Model } from "sequelize";
import { IsNumber, IsString, Length, IsEnum, IsOptional, } from "class-validator";
export default function initChatModel(sequelize) {
    class Chat extends Model {
    }
    __decorate([
        IsNumber(),
        __metadata("design:type", Number)
    ], Chat.prototype, "id", void 0);
    __decorate([
        IsString(),
        Length(1, 255),
        __metadata("design:type", String)
    ], Chat.prototype, "userId", void 0);
    __decorate([
        IsString(),
        Length(1, 255),
        __metadata("design:type", String)
    ], Chat.prototype, "title", void 0);
    __decorate([
        IsEnum(["web", "sms"]),
        __metadata("design:type", String)
    ], Chat.prototype, "channel", void 0);
    __decorate([
        IsNumber(),
        IsOptional(),
        __metadata("design:type", Number)
    ], Chat.prototype, "organizationUserId", void 0);
    Chat.init({
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
    }, {
        sequelize,
        modelName: "Chat",
        tableName: "chats",
        timestamps: true,
    });
    return Chat;
}
//# sourceMappingURL=chat.js.map