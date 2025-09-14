import { DataTypes, Model, Sequelize } from "sequelize";
import { sign } from "jsonwebtoken";
// import authConfig from "../config/auth";
// import webHooks from "../config/webHooks.dev.json";

import ApiConfig from "./ApiConfig";

import Tenant from "./Tenant";
import Ticket from "./Ticket";
import ChatFlow from "./ChatFlow";

export class Whatsapp extends Model {
  declare id: number;
  declare name: string;
  declare session: string;
  declare qrcode: string;
  declare status: string;
  declare battery: string;
  declare plugged: boolean;
  declare isActive: boolean;
  declare isDeleted: boolean;
  declare retries: number;
  declare isDefault: boolean;
  declare tokenTelegram: string;
  declare type: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare number: string;
  declare wppUser: string;
  declare pairingCodeEnabled: boolean;
  declare pairingCode: string;
  declare phone: object;
  declare tenantId: number;
  declare chatFlowId: number;
  declare wabaBSP: string;
  declare tokenAPI: string;
  declare tokenHook: string;
  declare farewellMessage: string;

  get UrlWabaWebHook(): string | null {
    const key = this.getDataValue("tokenHook");
    const wabaBsp = this.getDataValue("wabaBSP");
    let backendUrl = process.env.BACKEND_URL;
    // if (process.env.NODE_ENV === "development") {
    //   backendUrl = webHooks.urlWabahooks;
    // }
    return `${backendUrl}/wabahooks/${wabaBsp}/${key}`;
  }

  static initModel(sequelize: Sequelize): typeof Whatsapp {
    Whatsapp.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        session: DataTypes.STRING,
        qrcode: DataTypes.STRING,
        status: DataTypes.STRING,
        battery: DataTypes.STRING,
        plugged: DataTypes.BOOLEAN,
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        retries: DataTypes.INTEGER,
        isDefault: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        tokenTelegram: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        type: {
          type: DataTypes.STRING,
          defaultValue: "whatsapp",
        },
        createdAt: DataTypes.DATE(6),
        updatedAt: DataTypes.DATE(6),
        number: DataTypes.STRING,
        wppUser: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        pairingCodeEnabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        pairingCode: DataTypes.STRING,
        phone: DataTypes.JSONB,
        tenantId: DataTypes.INTEGER,
        chatFlowId: DataTypes.INTEGER,
        wabaBSP: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        tokenAPI: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        tokenHook: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        farewellMessage: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        UrlWabaWebHook: {
          type: DataTypes.VIRTUAL,
          get(this: Whatsapp) {
            const key = this.getDataValue("tokenHook");
            const wabaBsp = this.getDataValue("wabaBSP");
            let backendUrl = process.env.BACKEND_URL;
            // if (process.env.NODE_ENV === "development") {
            //   backendUrl = webHooks.urlWabahooks;
            // }
            return `${backendUrl}/wabahooks/${wabaBsp}/${key}`;
          },
        },
      },
      {
        sequelize,
        modelName: "Whatsapp",
        tableName: "Whatsapp",
        hooks: {
          beforeCreate: async (instance: Whatsapp) => {
            await Whatsapp.CreateTokenWebHook(instance);
          },
          beforeUpdate: async (instance: Whatsapp) => {
            await Whatsapp.CreateTokenWebHook(instance);
          },
          afterUpdate: async (instance: Whatsapp) => {
            await Whatsapp.HookStatus(instance);
          },
        },
      }
    );

    return Whatsapp;
  }

  static associate() {
    Whatsapp.hasMany(Ticket, { foreignKey: "whatsappId", as: "tickets" });
    Whatsapp.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
    Whatsapp.belongsTo(ChatFlow, { foreignKey: "chatFlowId", as: "chatFlow" });
  }

  static async HookStatus(instance: Whatsapp & any): Promise<void> {
    const { status, name, qrcode, number, tenantId, id: sessionId } = instance;
    const payload: any = {
      name,
      number,
      status,
      qrcode,
      timestamp: Date.now(),
      type: "hookSessionStatus",
    };

    const apiConfig: any = await ApiConfig.findAll({
      where: { tenantId, sessionId },
    });

    if (!apiConfig) return;

    // Aqui você pode reativar a lógica de enviar jobs para WebHooksAPI
  }

  static async CreateTokenWebHook(instance: Whatsapp): Promise<void> {
    const { secret } = authConfig;

    if (
      !instance?.tokenHook &&
      (instance.type === "waba" || instance.type === "messenger")
    ) {
      const tokenHook = sign(
        {
          tenantId: instance.tenantId,
          whatsappId: instance.id,
        },
        secret,
        {
          expiresIn: "10000d",
        }
      );

      instance.tokenHook = tokenHook;
    }
  }
}

export default Whatsapp;
