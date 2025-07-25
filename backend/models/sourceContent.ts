import { DataTypes, Model, Sequelize, QueryTypes } from "sequelize";
import { IsNumber, IsString, IsEnum } from "class-validator";

interface MaxIdResult {
  max_id: number | null;
}

export default function initSourceContentmodel(sequelize: Sequelize) {
  class SourceContent extends Model {
    @IsNumber()
    id!: number;

    @IsEnum(["file", "url", "gdrive"])
    type!: "file" | "url" | "gdrive";

    @IsString()
    path!: string;

    @IsString()
    googleDriveFileId?: string;

    @IsString()
    createdAt!: Date;

    @IsString()
    updatedAt!: Date;
  }

  SourceContent.init(
    {
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
    },
    {
      sequelize,
      modelName: "SourceContent",
      tableName: "source-contents",
      timestamps: true,
    }
  );
  return SourceContent;
}
