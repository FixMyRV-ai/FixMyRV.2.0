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
import { IsString } from "class-validator";
export default function initTwilioSettingModel(sequelize) {
    class TwilioSetting extends Model {
    }
    __decorate([
        IsString(),
        __metadata("design:type", Number)
    ], TwilioSetting.prototype, "id", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", String)
    ], TwilioSetting.prototype, "accountSid", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", String)
    ], TwilioSetting.prototype, "authToken", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", String)
    ], TwilioSetting.prototype, "phoneNumber", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", String)
    ], TwilioSetting.prototype, "optinMessage", void 0);
    TwilioSetting.init({
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
    }, {
        sequelize,
        modelName: "TwilioSetting",
        tableName: "twilio_settings",
        timestamps: true,
    });
    return TwilioSetting;
}
//# sourceMappingURL=twilioSetting.js.map