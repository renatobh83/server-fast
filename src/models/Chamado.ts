import { DataTypes, Model, Sequelize } from "sequelize";
import User from "./User";
import PauseHistory from "./PauseHistoryChamado";
import Ticket from "./Ticket";
import Empresa from "./Empresa";
import Media from "./Media";

export class Chamado extends Model {
  declare id: number;
  declare ticketId?: number | null;
  declare empresaId: number;
  declare userId: number;
  declare descricao?: string | null;
  declare assunto?: string | null;
  declare contatoId?: number[] | null;
  declare conclusao?: string | null;
  declare comentarios?: string[] | null;
  declare ticketsAssociados?: number[] | null;
  declare status: "ABERTO" | "EM_ANDAMENTO" | "CONCLUIDO" | "PAUSADO";
  declare closedAt?: Date | null;
  declare tempoChamado?: number | null;
  declare motivo?: string | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static initModel(sequelize: Sequelize): typeof Chamado {
    Chamado.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        ticketId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: "Ticket",
            key: "id",
          },
        },
        empresaId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Empresa",
            key: "id",
          },
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "User",
            key: "id",
          },
        },
        ticketsAssociados: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        contatoId: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(
            "ABERTO",
            "EM_ANDAMENTO",
            "CONCLUIDO",
            "PAUSADO"
          ),
          allowNull: false,
          defaultValue: "ABERTO",
        },
        closedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        tempoChamado: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        descricao: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        assunto: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        conclusao: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        motivo: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        comentarios: {
          type: DataTypes.JSON,
          allowNull: true,
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
        tableName: "Chamados",
        modelName: "Chamado",
        timestamps: true,
        hooks: {
          async beforeUpdate(ticket: Chamado) {
            if (ticket.changed("closedAt") && ticket.closedAt) {
              const pauseHistory = await PauseHistory.findAll({
                where: { chamadoId: ticket.id },
              });

              const createdAt = new Date(ticket.createdAt!);
              const closedAt = new Date(ticket.closedAt);
              let totalTime = closedAt.getTime() - createdAt.getTime();

              // Subtrai o tempo de pausas
              pauseHistory.forEach((pause: PauseHistory) => {
                const pauseStart = new Date(pause.startTime);
                const pauseEnd = pause.endTime
                  ? new Date(pause.endTime)
                  : new Date();
                totalTime -= pauseEnd.getTime() - pauseStart.getTime();
              });

              ticket.tempoChamado = (ticket.tempoChamado ?? 0) + totalTime;
            }
          },
        },
      }
    );

    return Chamado;
  }

  static associate() {
    Chamado.belongsTo(Ticket, {
      foreignKey: "ticketId",
      as: "ticket",
    });

    Chamado.belongsTo(Empresa, {
      foreignKey: "empresaId",
      as: "empresa",
    });

    Chamado.belongsTo(User, {
      foreignKey: "userId",
      as: "usuario",
    });

    Chamado.hasMany(PauseHistory, {
      foreignKey: "chamadoId",
      as: "pauseHistory",
    });

    Chamado.hasMany(Media, {
      foreignKey: "chamadoId",
      as: "media",
    });
  }
}

export default Chamado;
