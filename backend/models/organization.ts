import { DataTypes, Model, Sequelize } from "sequelize";
import { IsString, IsOptional, IsDate } from "class-validator";

export default function initOrganizationModel(sequelize: Sequelize): any {
  class Organization extends Model {
    @IsString()
    id!: number;

    @IsString()
    name!: string;

    @IsDate()
    @IsOptional()
    createdAt?: Date;

    @IsDate()
    @IsOptional()
    updatedAt?: Date;
  }

  Organization.init(
    {
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
    },
    {
      sequelize,
      modelName: "Organization",
      tableName: "organizations",
      timestamps: true,
    }
  );

  return Organization;
}
