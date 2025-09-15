import { Sequelize, DataTypes, Model } from "sequelize";
import Queue from "./Queue";
import User from "./User";

interface IUsersQueues {
  id?: number;
  queueId: number;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class UsersQueues extends Model<IUsersQueues> implements IUsersQueues {
  declare id: number;
  declare queueId: number;
  declare userId: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare queue?: Queue;
  declare user?: User;

  static associate(models: any) {
    UsersQueues.belongsTo(models.Queue, { foreignKey: "queueId", as: "queue" });
    UsersQueues.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  }

  static initModel(sequelize: Sequelize): typeof UsersQueues {
    UsersQueues.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        queueId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        userId: {
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
        tableName: "UsersQueues",
        modelName: "UsersQueues",
        freezeTableName: true,
      }
    );

    return UsersQueues;
  }
}

export default UsersQueues;
