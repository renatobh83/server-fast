import { DataTypes, Model, Sequelize } from "sequelize";
import Tenant from "./Tenant";
import User from "./User";

export class ChatFlow extends Model {
  declare id: number;
  declare name: string;
  declare flow: any;
  declare isActive: boolean;
  declare isDeleted: boolean;
  declare celularTeste?: string | null;
  declare userId: number;
  declare tenantId: number;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  get flowData(): any {
    const flow = this.getDataValue("flow");
    if (flow) {
      for (const node of flow.nodeList) {
        if (node.type === "node") {
          for (const item of node.data.interactions) {
            if (item.type === "MediaField" && item.data.mediaUrl) {
              const { BACKEND_URL, PROXY_PORT } = process.env;
              const file = item.data.mediaUrl;
              item.data.fileName = file;
              item.data.mediaUrl = `${BACKEND_URL}:${PROXY_PORT}/public/${file}`;
            }
          }
        }
      }
      return flow;
    }
    return {};
  }

  static initModel(sequelize: Sequelize): typeof ChatFlow {
    ChatFlow.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        flow: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: {},
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        celularTeste: {
          type: DataTypes.TEXT,
          allowNull: true,
          defaultValue: null,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        createdAt: DataTypes.DATE(6),
        updatedAt: DataTypes.DATE(6),
      },
      {
        sequelize,
        modelName: "ChatFlow",
        tableName: "ChatFlows",
      }
    );

    return ChatFlow;
  }

  static associate() {
    ChatFlow.belongsTo(User, { foreignKey: "userId", as: "user" });
    ChatFlow.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
  }
}

export default ChatFlow;
