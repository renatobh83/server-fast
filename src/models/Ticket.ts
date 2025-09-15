import { DataTypes, Model, Sequelize } from "sequelize";
import { format } from "date-fns";

import Tenant from "./Tenant";
import User from "./User";
import Message from "./Message";
import Contact from "./Contact";
import Whatsapp from "./Whatsapp";
import ChatFlow from "./ChatFlow";
import Empresa from "./Empresa";
import Queue from "./Queue";

export class Ticket extends Model {
  declare id: number;
  declare status: string;
  declare unreadMessages: number;
  declare lastMessage: string;
  declare channel: string;
  declare answered: boolean;
  declare isGroup: boolean;
  declare associatedCalls: boolean;
  declare isActiveDemand: boolean;
  declare isFarewellMessage: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare lastInteractionBot: Date;
  declare botRetries: number;
  declare closedAt: number;
  declare lastMessageAt: number;
  declare startedAttendanceAt: number;
  declare chamadoId: number;
  declare userId: number | null;
  declare contactId: number;
  declare lastAbsenceMessageAt: Date;
  declare whatsappId: number;
  // declare autoReplyId: number;
  // declare stepAutoReplyId: number;
  declare chatFlowId: number;
  declare chatClient: boolean;
  declare socketId: string;
  declare empresaId: number;
  declare stepChatFlow: string | null;
  declare queueId: number | null;
  declare tenantId: number;
  declare isTransference: string | boolean | null;
  declare isCreated: boolean | null;
  declare scheduledMessages: Message[];
  declare apiConfig: object | null;

  // getter virtual
  get protocol(): string {
    const date = this.getDataValue("createdAt");
    const formatDate = format(new Date(date!), "ddMMyyyyHHmmss");
    const id = this.getDataValue("id");
    return `${formatDate}${id}`;
  }

  static initModel(sequelize: Sequelize): typeof Ticket {
    Ticket.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: "pending",
        },
        unreadMessages: DataTypes.INTEGER,
        lastMessage: DataTypes.STRING,
        channel: DataTypes.STRING,
        answered: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        isGroup: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        associatedCalls: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        isActiveDemand: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        isFarewellMessage: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        createdAt: DataTypes.DATE(6),
        updatedAt: DataTypes.DATE(6),
        lastInteractionBot: DataTypes.DATE,
        botRetries: DataTypes.INTEGER,
        closedAt: DataTypes.BIGINT,
        lastMessageAt: DataTypes.BIGINT,
        startedAttendanceAt: DataTypes.BIGINT,
        chamadoId: DataTypes.BIGINT,
        contactId: DataTypes.INTEGER,
        lastAbsenceMessageAt: DataTypes.DATE(6),
        whatsappId: DataTypes.INTEGER,
        // autoReplyId: DataTypes.INTEGER,
        // stepAutoReplyId: DataTypes.INTEGER,
        chatFlowId: DataTypes.INTEGER,
        chatClient: DataTypes.BOOLEAN,
        socketId: DataTypes.STRING,
        empresaId: DataTypes.INTEGER,
        stepChatFlow: {
          type: DataTypes.TEXT,
          allowNull: true,
          defaultValue: null,
        },
        queueId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        tenantId: DataTypes.INTEGER,
        isTransference: {
          type: DataTypes.VIRTUAL,
          defaultValue: null,
        },
        isCreated: {
          type: DataTypes.VIRTUAL,
          defaultValue: null,
        },
        scheduledMessages: {
          type: DataTypes.VIRTUAL,
          defaultValue: [],
        },
        apiConfig: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: null,
        },
        protocol: {
          type: DataTypes.VIRTUAL,
          get(this: Ticket) {
            const date = this.getDataValue("createdAt");
            const formatDate = format(new Date(date!), "ddMMyyyyHHmmss");
            const id = this.getDataValue("id");
            return `${formatDate}${id}`;
          },
        },
      },
      {
        sequelize,
        modelName: "Ticket",
        tableName: "Tickets",
      }
    );

    return Ticket;
  }

  static associate() {
    Ticket.belongsTo(User, { foreignKey: "userId", as: "user" });
    Ticket.belongsTo(Contact, { foreignKey: "contactId", as: "contact" });
    Ticket.belongsTo(Whatsapp, { foreignKey: "whatsappId", as: "whatsapp" });
    Ticket.belongsTo(ChatFlow, { foreignKey: "chatFlowId", as: "chatFlow" });
    Ticket.belongsTo(Empresa, { foreignKey: "empresaId", as: "empresa" });
    Ticket.belongsTo(Queue, { foreignKey: "queueId", as: "queue" });
    Ticket.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
    Ticket.hasMany(Message, { foreignKey: "ticketId", as: "messages" });
    // Ticket.belongsTo(AutoReply, { foreignKey: "autoReplyId", as: "autoReply" });
    // Ticket.belongsTo(StepsReply, { foreignKey: "stepAutoReplyId", as: "stepsReply" });
    // Ticket.hasMany(MessagesOffLine, { foreignKey: "ticketId", as: "messagesOffLine" });
  }
}

export default Ticket;
