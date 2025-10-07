import { Sequelize, DataTypes, Model } from "sequelize";
import CryptoJS from "crypto-js";
import { v4 as uuidV4 } from "uuid";
import { isEncrypted } from "../helpers/isEncrypted";
import Ticket from "./Ticket";

interface IMessage {
  id?: string;
  messageId?: string;
  ack?: number;
  status?: "pending" | "sended" | "received" | "canceled";
  wabaMediaId?: string | null;
  read?: boolean;
  fromMe?: boolean;
  body?: string;
  mediaName?: string | null;
  mediaUrl?: string | null;
  mediaType?: string;
  reaction?: string;
  reactionFromMe?: string;
  contactId?: number;
  userId?: number;
  ticketId?: number;
  tenantId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  timestamp?: number;
  scheduleDate?: Date;
  sendType?: "campaign" | "chat" | "external" | "schedule" | "bot" | "sync";
  quotedMsgId?: string;
  idFront?: string;
  isDeleted?: boolean;
  isForwarded?: boolean;
}

class Message extends Model<IMessage> implements IMessage {
  declare id: string;
  declare messageId: string;
  declare ack: number;
  declare status: "pending" | "sended" | "received" | "canceled";
  declare wabaMediaId: string | null;
  declare read: boolean;
  declare fromMe: boolean;
  declare body: string;
  declare mediaName: string | null;
  declare mediaUrl: string | null;
  declare mediaType: string;
  declare reaction: string;
  declare reactionFromMe: string;
  declare contactId: number;
  declare userId: number;
  declare ticketId: number;
  declare ticket: Ticket;
  declare tenantId: number;
  declare timestamp: number;
  declare scheduleDate: Date;
  declare sendType:
    | "campaign"
    | "chat"
    | "external"
    | "schedule"
    | "bot"
    | "sync";
  declare quotedMsgId: string;
  declare quotedMsg: Message;
  declare idFront: string;
  declare isDeleted: boolean;
  declare isForwarded: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    Message.belongsTo(models.Ticket, { foreignKey: "ticketId", as: "ticket" });
    Message.belongsTo(models.Contact, {
      foreignKey: "contactId",
      as: "contact",
    });
    Message.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Message.belongsTo(models.Tenant, { foreignKey: "tenantId", as: "tenant" });
    Message.belongsTo(models.Message, {
      foreignKey: "quotedMsgId",
      targetKey: "messageId",
      as: "quotedMsg",
    });
  }

  static initModel(sequelize: Sequelize): typeof Message {
    Message.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: uuidV4,
          primaryKey: true,
        },
        messageId: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        ack: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        status: {
          type: DataTypes.ENUM("pending", "sended", "received", "canceled"),
          defaultValue: "pending",
        },
        wabaMediaId: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        read: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        fromMe: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        body: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        mediaType: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        reaction: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        reactionFromMe: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        contactId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ticketId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        mediaUrl: {
          type: DataTypes.STRING,
          get() {
            const { BACKEND_URL, NODE_ENV, PROXY_PORT } = process.env;
            const filename = this.getDataValue("mediaUrl");
            if (!filename) return null;

            // Condicional para verificar se estamos em ambiente de desenvolvimento
            if (NODE_ENV === "development" && PROXY_PORT) {
              // Se estiver em dev e houver uma porta, inclua-a na URL
              return `${BACKEND_URL}:${PROXY_PORT}/public/${filename}`;
            } else {
              // Caso contrário, retorne a URL sem a porta

              return `${BACKEND_URL}/public/${filename}`;
            }
          },
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        timestamp: {
          type: DataTypes.BIGINT,
          allowNull: true,
        },
        scheduleDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        sendType: {
          type: DataTypes.ENUM(
            "campaign",
            "chat",
            "external",
            "schedule",
            "bot",
            "sync"
          ),
          defaultValue: "chat",
        },
        quotedMsgId: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
        },
        idFront: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        isForwarded: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
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
        tableName: "Messages",
        modelName: "Message",
        freezeTableName: true,
        hooks: {
          beforeCreate: async (message: Message) => {
            if (!message.body || message.body.trim() === "") {
              message.body = "Bot message - sem conteudo";
            }
            if (!isEncrypted(message.body)) {
              message.body = Message.encrypt(message.body);
            }
          },
          beforeUpdate: async (message: Message) => {
            if (!message.body || message.body.trim() === "") {
              message.body = "Bot message - sem conteudo";
            }
            if (!isEncrypted(message.body)) {
              message.body = Message.encrypt(message.body);
            }
          },
        },
      }
    );

    return Message;
  }

  static encrypt(text: string): string {
    const secretKey = process.env.CHAT_SECRET!;
    if (secretKey.length !== 64) {
      throw new Error("SECRET_KEY deve ter 64 caracteres hex (32 bytes)");
    }
    const key = CryptoJS.enc.Hex.parse(secretKey);
    const iv = CryptoJS.lib.WordArray.random(16);

    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return iv.toString(CryptoJS.enc.Hex) + ":" + encrypted.toString();
  }

  static decrypt(encryptedText: string): string {
    const secretKey = process.env.CHAT_SECRET!;
    if (secretKey.length !== 64) {
      throw new Error("SECRET_KEY deve ter 64 caracteres hex (32 bytes)");
    }
    const key = CryptoJS.enc.Hex.parse(secretKey);

    const [ivHex, encrypted] = encryptedText.split(":");

    // Verifica se ambos os valores existem
    if (!ivHex || !encrypted) {
      throw new Error("Formato de texto criptografado inválido");
    }

    const iv = CryptoJS.enc.Hex.parse(ivHex);

    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

export default Message;
