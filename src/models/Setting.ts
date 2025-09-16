import { Sequelize, DataTypes, Model } from "sequelize";
import Tenant from "./Tenant";

interface ISetting {
  id?: number;
  key: string;
  value: string;
  tenantId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class Setting extends Model<ISetting> implements ISetting {
  declare id: number;
  declare key: string;
  declare value: string;
  declare tenantId: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare tenant?: Tenant;

  static associate(models: any) {
    Setting.belongsTo(models.Tenant, { foreignKey: "tenantId", as: "tenant" });
  }

  static initModel(sequelize: Sequelize): typeof Setting {
    Setting.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        key: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        value: {
          type: DataTypes.STRING,
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
        tableName: "Settings",
        modelName: "Setting",
      }
    );

    return Setting;
  }
}

export default Setting;
