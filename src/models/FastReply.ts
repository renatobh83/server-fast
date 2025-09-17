import { DataTypes, Model, Sequelize } from "sequelize";
import Tenant from "./Tenant";
import User from "./User";

class FastReply extends Model {
  declare id: number;
  declare key: string;
  declare message: string;
  declare userId: number;
  declare tenantId: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  static initModel(sequelize: Sequelize): typeof FastReply {
    FastReply.init(
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
        message: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "User",
            key: "id",
          },
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Tenant",
            key: "id",
          },
        },
        createdAt: {
          type: DataTypes.DATE(6),
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE(6),
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "FastReply",
        modelName: "FastReply",
        timestamps: true,
        freezeTableName: true,
      }
    );

    return FastReply;
  }

  static associate() {
    FastReply.belongsTo(User, {
      foreignKey: "userId",
      as: "user",
    });

    FastReply.belongsTo(Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
  }
}

export default FastReply;
