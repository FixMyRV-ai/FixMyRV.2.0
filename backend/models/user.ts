import bcrypt from "bcrypt";
import { plainToClass } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  validate,
} from "class-validator";
import { DataTypes, Model, Sequelize, ModelCtor } from "sequelize";

export default function initUserModel(sequelize: Sequelize): any {
  class User extends Model {
    @IsString()
    @Length(1, 255)
    firstName!: string;

    @IsString()
    @Length(1, 255)
    lastName!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @Length(6, 100)
    password!: string;

    @IsEnum(["user", "admin"])
    role!: "user" | "admin";

    @IsBoolean()
    @IsOptional()
    verified!: boolean;

    @IsString()
    @IsOptional()
    verificationToken?: string;

    @IsString()
    @IsOptional()
    resetPasswordToken?: string;

    @IsDate()
    @IsOptional()
    resetPasswordExpires?: Date;

    @IsString()
    @IsOptional()
    otp?: string;

    @IsDate()
    @IsOptional()
    otpExpiry?: Date;

    @IsString()
    @IsOptional()
    profileImage?: string;

    @IsString()
    @IsOptional()
    stripeCustomerId?: string;

    @IsNumber()
    credits!: number;

    @IsEnum(["subscription", "payment"])
    plan_type!: "subscription" | "payment";

    @IsEnum(["normal", "pro"])
    type!: "normal" | "pro";

    @IsString()
    @IsOptional()
    sessionId?: string | null;

    // Add a hook to hash the password before saving
    static async hashPassword(user: User) {
      if (user.changed("password")) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }

    // Method to check password validity
    async isValidPassword(password: string): Promise<boolean> {
      return bcrypt.compare(password, this.password);
    }

    // Custom validation logic
    static async validateUser(userData: Partial<User>) {
      const userInstance = plainToClass(User, userData);
      const errors = await validate(userInstance);
      if (errors.length > 0) {
        throw new Error(
          "Validation failed: " + errors.map((err) => err.toString()).join(", ")
        );
      }
    }
  }

  User.init(
    {
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
        set(value: string) {
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
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      hooks: {
        beforeSave: User.hashPassword,
      },
      paranoid: true,
    }
  );

  User.addHook("beforeCreate", async (user: User) => {
    await User.validateUser(user);
  });

  User.addHook("beforeUpdate", async (user: User) => {
    await User.validateUser(user);
  });

  return User;
}