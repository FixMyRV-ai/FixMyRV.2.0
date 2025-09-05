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
import { IsNumber, IsString, IsEnum } from "class-validator";
export default function initSourceContentmodel(sequelize) {
    class SourceContent extends Model {
    }
    __decorate([
        IsNumber(),
        __metadata("design:type", Number)
    ], SourceContent.prototype, "id", void 0);
    __decorate([
        IsEnum(["file", "url", "gdrive"]),
        __metadata("design:type", String)
    ], SourceContent.prototype, "type", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", String)
    ], SourceContent.prototype, "path", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", String)
    ], SourceContent.prototype, "googleDriveFileId", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", Date)
    ], SourceContent.prototype, "createdAt", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", Date)
    ], SourceContent.prototype, "updatedAt", void 0);
    SourceContent.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            field: "id",
            autoIncrementIdentity: true,
        },
        type: {
            type: DataTypes.ENUM("file", "url", "gdrive"),
            allowNull: false,
        },
        path: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        googleDriveFileId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: "SourceContent",
        tableName: "source-contents",
        timestamps: true,
    });
    return SourceContent;
}
//# sourceMappingURL=sourceContent.js.map