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
import { IsNumber, IsString } from "class-validator";
export default function initSettingmodel(sequelize) {
    class Setting extends Model {
    }
    __decorate([
        IsNumber(),
        __metadata("design:type", Number)
    ], Setting.prototype, "id", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", String)
    ], Setting.prototype, "key", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", String)
    ], Setting.prototype, "chatModel", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", String)
    ], Setting.prototype, "embeddingModel", void 0);
    __decorate([
        IsNumber(),
        __metadata("design:type", Number)
    ], Setting.prototype, "outputTokens", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", String)
    ], Setting.prototype, "systemPrompt", void 0);
    Setting.init({
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
    }, {
        sequelize,
        modelName: "Setting",
        tableName: "settings",
        timestamps: true,
    });
    return Setting;
}
//# sourceMappingURL=setting.js.map