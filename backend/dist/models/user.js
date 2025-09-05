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
import { IsBoolean, IsDate, IsEmail, IsEnum, IsNumber, IsOptional, IsString, Length, validate, } from "class-validator";
import { DataTypes, Model } from "sequelize";
export default function initUserModel(sequelize) {
    class User extends Model {
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
        static async validateUser(userData) {
            const userInstance = plainToClass(User, userData);
            const errors = await validate(userInstance);
            if (errors.length > 0) {
                throw new Error("Validation failed: " + errors.map((err) => err.toString()).join(", "));
            }
        }
    }
    __decorate([
        IsString(),
        Length(1, 255),
        __metadata("design:type", String)
    ], User.prototype, "firstName", void 0);
    __decorate([
        IsString(),
        Length(1, 255),
        __metadata("design:type", String)
    ], User.prototype, "lastName", void 0);
    __decorate([
        IsEmail(),
        __metadata("design:type", String)
    ], User.prototype, "email", void 0);
    __decorate([
        IsString(),
        Length(6, 100),
        __metadata("design:type", String)
    ], User.prototype, "password", void 0);
    __decorate([
        IsEnum(["user", "admin"]),
        __metadata("design:type", String)
    ], User.prototype, "role", void 0);
    __decorate([
        IsBoolean(),
        IsOptional(),
        __metadata("design:type", Boolean)
    ], User.prototype, "verified", void 0);
    __decorate([
        IsString(),
        IsOptional(),
        __metadata("design:type", String)
    ], User.prototype, "verificationToken", void 0);
    __decorate([
        IsString(),
        IsOptional(),
        __metadata("design:type", String)
    ], User.prototype, "resetPasswordToken", void 0);
    __decorate([
        IsDate(),
        IsOptional(),
        __metadata("design:type", Date)
    ], User.prototype, "resetPasswordExpires", void 0);
    __decorate([
        IsString(),
        IsOptional(),
        __metadata("design:type", String)
    ], User.prototype, "otp", void 0);
    __decorate([
        IsDate(),
        IsOptional(),
        __metadata("design:type", Date)
    ], User.prototype, "otpExpiry", void 0);
    __decorate([
        IsString(),
        IsOptional(),
        __metadata("design:type", String)
    ], User.prototype, "profileImage", void 0);
    __decorate([
        IsString(),
        IsOptional(),
        __metadata("design:type", String)
    ], User.prototype, "stripeCustomerId", void 0);
    __decorate([
        IsNumber(),
        __metadata("design:type", Number)
    ], User.prototype, "credits", void 0);
    __decorate([
        IsEnum(["subscription", "payment"]),
        __metadata("design:type", String)
    ], User.prototype, "plan_type", void 0);
    __decorate([
        IsEnum(["normal", "pro"]),
        __metadata("design:type", String)
    ], User.prototype, "type", void 0);
    __decorate([
        IsString(),
        IsOptional(),
        __metadata("design:type", Object)
    ], User.prototype, "sessionId", void 0);
    __decorate([
        IsNumber(),
        IsOptional(),
        __metadata("design:type", Number)
    ], User.prototype, "organizationId", void 0);
    User.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
            unique: true,
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
            type: DataTypes.ENUM("user", "admin"),
            allowNull: false,
            defaultValue: "user",
            validate: {
                isIn: [["user", "admin"]],
            },
        },
        type: {
            type: DataTypes.ENUM("pro", "normal"),
            allowNull: false,
            defaultValue: "normal",
            validate: {
                isIn: [["pro", "normal"]],
            },
        },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        verificationToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        resetPasswordToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        resetPasswordExpires: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        otp: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        otpExpiry: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        profileImage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        stripeCustomerId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        credits: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        plan_type: {
            type: DataTypes.ENUM("subscription", "payment"),
            allowNull: true,
            defaultValue: "payment",
            validate: {
                isIn: [["subscription", "payment"]],
            },
        },
        sessionId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        organizationId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'organizations',
                key: 'id',
            },
        },
    }, {
        sequelize,
        modelName: "User",
        tableName: "users",
        hooks: {
            beforeSave: User.hashPassword,
        },
        paranoid: true,
    });
    User.addHook("beforeCreate", async (user) => {
        await User.validateUser(user);
    });
    User.addHook("beforeUpdate", async (user) => {
        await User.validateUser(user);
    });
    return User;
}
//# sourceMappingURL=user.js.map