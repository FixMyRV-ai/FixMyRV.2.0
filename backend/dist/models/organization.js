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
import { IsString, IsOptional, IsDate } from "class-validator";
export default function initOrganizationModel(sequelize) {
    class Organization extends Model {
    }
    __decorate([
        IsString(),
        __metadata("design:type", Number)
    ], Organization.prototype, "id", void 0);
    __decorate([
        IsString(),
        __metadata("design:type", String)
    ], Organization.prototype, "name", void 0);
    __decorate([
        IsDate(),
        IsOptional(),
        __metadata("design:type", Date)
    ], Organization.prototype, "createdAt", void 0);
    __decorate([
        IsDate(),
        IsOptional(),
        __metadata("design:type", Date)
    ], Organization.prototype, "updatedAt", void 0);
    Organization.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 255],
            },
        },
    }, {
        sequelize,
        modelName: "Organization",
        tableName: "organizations",
        timestamps: true,
    });
    return Organization;
}
//# sourceMappingURL=organization.js.map