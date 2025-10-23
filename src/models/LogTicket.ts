import { Sequelize, DataTypes, Model, Optional } from "sequelize";

interface LogTicketProps {
  id?: number;
  type: string;
  createdAt?: Date;
  updatedAt?: Date;
  chamadoId?: number;
  userId?: number | null;
  queueId?: number;
  tenantId?: number;
  ticketId?: number;
}

type LogTicketCreationAttributes = Optional<
  LogTicketProps,
  "id" | "createdAt" | "updatedAt"
>;

class LogTicket
  extends Model<LogTicketProps, LogTicketCreationAttributes>
  implements LogTicketProps
{
  declare id: number;
  declare type: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare chamadoId: number;
  declare userId: number | null;
  declare queueId: number;
  declare tenantId: number;
  declare ticketId: number;

  // Associações
  static associate(models: any) {
    LogTicket.belongsTo(models.Chamado, { foreignKey: "chamadoId" });
    LogTicket.belongsTo(models.User, { foreignKey: "userId" });
    LogTicket.belongsTo(models.Queue, { foreignKey: "queueId" });
    LogTicket.belongsTo(models.Tenant, { foreignKey: "tenantId" });
    LogTicket.belongsTo(models.Ticket, { foreignKey: "ticketId" });
  }

  // init separado para seguir o mesmo padrão dos outros modelos
  static initModel(sequelize: Sequelize): typeof LogTicket {
    LogTicket.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        type: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE(6),
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE(6),
          defaultValue: DataTypes.NOW,
        },
        chamadoId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        queueId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ticketId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "LogTickets",
        freezeTableName: true,
      }
    );

    return LogTicket;
  }
}

export default LogTicket;
