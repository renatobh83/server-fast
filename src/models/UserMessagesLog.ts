import { Sequelize, DataTypes, Model } from "sequelize";
import User from "./User";
import Message from "./Message";
import Ticket from "./Ticket";

interface IUserMessagesLog {
  id?: number;
  userId: number;
  messageId?: string | null;
  ticketId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class UserMessagesLog
  extends Model<IUserMessagesLog>
  implements IUserMessagesLog
{
  declare id: number;
  declare userId: number;
  declare messageId?: string | null;
  declare ticketId?: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare user?: User;
  declare message?: Message;
  declare ticket?: Ticket;

  static associate(models: any) {
    UserMessagesLog.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    UserMessagesLog.belongsTo(models.Message, {
      foreignKey: "messageId",
      targetKey: "id",
      as: "message",
    });
    UserMessagesLog.belongsTo(models.Ticket, {
      foreignKey: "ticketId",
      as: "ticket",
    });
  }

  static initModel(sequelize: Sequelize): typeof UserMessagesLog {
    UserMessagesLog.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        messageId: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        ticketId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        createdAt: {
          type: DataTypes.DATE(6),
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE(6),
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "UserMessagesLog",
        modelName: "UserMessagesLog",
        freezeTableName: true,
      }
    );

    return UserMessagesLog;
  }
}

export default UserMessagesLog;
