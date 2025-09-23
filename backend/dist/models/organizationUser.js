var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import bcrypt from "bcrypt";
import { plainToClass } from "class-transformer";
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Length, validate, } from "class-validator";
import { DataTypes, Model } from "sequelize";
export default function initOrganizationUserModel(sequelize) {
    class OrganizationUser extends Model {
        // Add a hook to hash the password before saving
        static async hashPassword(user) {
            if (user.changed("password")) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        }
        // Method to check password validity
        async isValidPassword(password) {
            return bcrypt.compare(password, this.password);
        }
        // Custom validation logic
        static async validateOrganizationUser(userData) {
            const userInstance = plainToClass(OrganizationUser, userData);
            const errors = await validate(userInstance);
            if (errors.length > 0) {
                throw new Error("Validation failed: " + errors.map((err) => err.toString()).join(", "));
            }
        }
        // Get full name
        get fullName() {
            return `${this.firstName} ${this.lastName}`;
        }
    }
    __decorate([
        IsOptional(),
        IsNumber(),
        __metadata("design:type", Number)
    ], OrganizationUser.prototype, "id", void 0);
    __decorate([
        IsOptional(),
        __metadata("design:type", Number)
    ], OrganizationUser.prototype, "organizationId", void 0);
    __decorate([
        IsString(),
        Length(1, 255),
        __metadata("design:type", String)
    ], OrganizationUser.prototype, "firstName", void 0);
    __decorate([
        IsString(),
        Length(1, 255),
        __metadata("design:type", String)
    ], OrganizationUser.prototype, "lastName", void 0);
    __decorate([
        IsEmail(),
        __metadata("design:type", String)
    ], OrganizationUser.prototype, "email", void 0);
    __decorate([
        IsString(),
        Length(6, 100),
        __metadata("design:type", String)
    ], OrganizationUser.prototype, "password", void 0);
    __decorate([
        IsEnum(["user", "admin", "manager"]),
        __metadata("design:type", String)
    ], OrganizationUser.prototype, "role", void 0);
    __decorate([
        IsBoolean(),
        IsOptional(),
        __metadata("design:type", Boolean)
    ], OrganizationUser.prototype, "verified", void 0);
    __decorate([
        IsString(),
        IsNotEmpty(),
        __metadata("design:type", String)
    ], OrganizationUser.prototype, "phone", void 0);
    __decorate([
        IsEnum(["active", "inactive", "suspended", "new_user", "invited"]),
        __metadata("design:type", String)
    ], OrganizationUser.prototype, "status", void 0);
    OrganizationUser.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        organizationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'organizations',
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 255],
            },
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 255],
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            set(value) {
                this.setDataValue("password", value);
            },
        },
        role: {
            type: DataTypes.ENUM("user", "admin", "manager"),
            allowNull: false,
            defaultValue: "user",
            validate: {
                isIn: [["user", "admin", "manager"]],
            },
        },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 20],
                notEmpty: true,
            },
        },
        status: {
            type: DataTypes.ENUM("active", "inactive", "suspended", "new_user", "invited"),
            allowNull: false,
            defaultValue: "new_user",
            validate: {
                isIn: [["active", "inactive", "suspended", "new_user", "invited"]],
            },
        },
    }, {
        sequelize,
        modelName: "OrganizationUser",
        tableName: "organization_users",
        hooks: {
            beforeSave: OrganizationUser.hashPassword,
        },
        indexes: [
            {
                unique: true,
                fields: ['organizationId', 'email'],
                name: 'organization_users_org_email_unique'
            },
            {
                fields: ['organizationId'],
                name: 'organization_users_organization_id_index'
            },
            {
                fields: ['email'],
                name: 'organization_users_email_index'
            },
            {
                fields: ['status'],
                name: 'organization_users_status_index'
            }
        ]
    });
    OrganizationUser.addHook("beforeCreate", async (user) => {
        await OrganizationUser.validateOrganizationUser(user);
    });
    OrganizationUser.addHook("beforeUpdate", async (user) => {
        await OrganizationUser.validateOrganizationUser(user);
    });
    return OrganizationUser;
}
//# sourceMappingURL=organizationUser.js.map