import { Sequelize, DataTypes, Model } from "sequelize";
import User from "./User";
import Tenant from "./Tenant";

interface ITags {
  id?: number;
  tag: string;
  color: string;
  isActive: boolean;
  userId: number;
  tenantId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class Tags extends Model<ITags> implements ITags {
  declare id: number;
  declare tag: string;
  declare color: string;
  declare isActive: boolean;
  declare userId: number;
  declare tenantId: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare user?: User;
  declare tenant?: Tenant;

  static associate(models: any) {
    Tags.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Tags.belongsTo(models.Tenant, { foreignKey: "tenantId", as: "tenant" });
  }

  static initModel(sequelize: Sequelize): typeof Tags {
    Tags.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        tag: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        color: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "Tags",
        modelName: "Tags",
        freezeTableName: true,
      }
    );

    return Tags;
  }
}

export default Tags;
