import bcrypt from "bcrypt";
import { plainToClass } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  validate,
} from "class-validator";
import { DataTypes, Model, Sequelize } from "sequelize";

export default function initOrganizationUserModel(sequelize: Sequelize): any {
  class OrganizationUser extends Model {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsOptional()
    organizationId?: number;

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

    @IsEnum(["user", "admin", "manager"])
    role!: "user" | "admin" | "manager";

    @IsBoolean()
    @IsOptional()
    verified!: boolean;

    @IsString()
    @IsNotEmpty()
    phone!: string;

    @IsEnum(["active", "inactive", "suspended", "new_user", "invited"])
    status!: "active" | "inactive" | "suspended" | "new_user" | "invited";

    // Add a hook to hash the password before saving
    static async hashPassword(user: OrganizationUser) {
      if (user.changed("password")) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }

    // Method to check password validity
    async isValidPassword(password: string): Promise<boolean> {
      return bcrypt.compare(password, this.password);
    }

    // Custom validation logic
    static async validateOrganizationUser(userData: Partial<OrganizationUser>) {
      const userInstance = plainToClass(OrganizationUser, userData);
      const errors = await validate(userInstance);
      if (errors.length > 0) {
        throw new Error(
          "Validation failed: " + errors.map((err) => err.toString()).join(", ")
        );
      }
    }

    // Get full name
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }

  OrganizationUser.init(
    {
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
        set(value: string) {
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
    },
    {
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
    }
  );

  OrganizationUser.addHook("beforeCreate", async (user: OrganizationUser) => {
    await OrganizationUser.validateOrganizationUser(user);
  });

  OrganizationUser.addHook("beforeUpdate", async (user: OrganizationUser) => {
    await OrganizationUser.validateOrganizationUser(user);
  });

  return OrganizationUser;
}
