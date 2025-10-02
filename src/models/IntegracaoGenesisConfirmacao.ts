import { DataTypes, Model, Sequelize } from "sequelize";
import Tenant from "./Tenant";

export class IntegracaoGenesisConfirmacao extends Model {
  declare id: string;
  declare status: string;
  declare contatoSend?: string | null;
  declare contato?: string | null;
  declare lastMessage?: string | null;
  declare procedimentos: number[];
  declare idexterno: number[];
  declare atendimentoData?: string | null;
  declare atendimentoHora?: string | null;
  declare answered: boolean;
  declare lastMessageAt?: number | null;
  declare messageResponse?: string | null;
  declare integracaoId: number;
  declare preparoEnviado: boolean;
  declare closedAt?: number | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;
  declare channel?: string | null;
  declare enviada?: Date | null;
  declare tenantId: number;

  static initModel(sequelize: Sequelize): typeof IntegracaoGenesisConfirmacao {
    IntegracaoGenesisConfirmacao.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: "pending",
        },
        contatoSend: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        contato: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        lastMessage: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        procedimentos: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        idexterno: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        atendimentoData: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        atendimentoHora: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        answered: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        lastMessageAt: {
          type: DataTypes.BIGINT,
          allowNull: true,
        },
        messageResponse: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        integracaoId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        preparoEnviado: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        closedAt: {
          type: DataTypes.BIGINT,
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
        channel: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        enviada: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Tenants", // nome da tabela do Tenant
            key: "id",
          },
        },
      },
      {
        sequelize,
        tableName: "IntegracaoGenesisConfirmacao",
        modelName: "IntegracaoGenesisConfirmacao",
        timestamps: true,
      }
    );

    return IntegracaoGenesisConfirmacao;
  }

  static associate() {
    IntegracaoGenesisConfirmacao.belongsTo(Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
  }
}

export default IntegracaoGenesisConfirmacao;
