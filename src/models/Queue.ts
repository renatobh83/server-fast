import { Sequelize, DataTypes, Model } from "sequelize";
import User from "./User";
import Tenant from "./Tenant";

interface IQueue {
  id?: number;
  queue: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  userId: number;
  tenantId: number;
}

class Queue extends Model<IQueue> implements IQueue {
  declare id: number;
  declare queue: string;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare userId: number;
  declare tenantId: number;

  declare user?: User;
  declare tenant?: Tenant;

  static associate(models: any) {
    Queue.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Queue.belongsTo(models.Tenant, { foreignKey: "tenantId", as: "tenant" });
  }

  static initModel(sequelize: Sequelize): typeof Queue {
    Queue.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        queue: {
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
        tableName: "Queues",
        modelName: "Queue",
        freezeTableName: true,
      }
    );

    return Queue;
  }
}

export default Queue;
