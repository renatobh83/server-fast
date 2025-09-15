import { Sequelize, DataTypes, Model } from "sequelize";
interface NotaFiscalProps {
  id?: number;
  numeroNota: string;
  codVerificacao: string;
  protocolo: string;
  rps: string;
  cancelada?: boolean;
  datacancelamento?: Date | null;
  tenantId: number;
  empresaId: number;
  createdAt?: Date;
  updatedAt?: Date;
  status?: string;
}

class NotaFiscal extends Model<NotaFiscalProps> implements NotaFiscalProps {
  declare id: number;
  declare numeroNota: string;
  declare codVerificacao: string;
  declare protocolo: string;
  declare rps: string;
  declare cancelada: boolean;
  declare datacancelamento: Date | null;
  declare tenantId: number;
  declare empresaId: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare status?: string;

  static associate(models: any) {
    NotaFiscal.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
    NotaFiscal.belongsTo(models.Empresa, {
      foreignKey: "empresaId",
      as: "empresa",
    });
  }

  static initModel(sequelize: Sequelize): typeof NotaFiscal {
    NotaFiscal.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        numeroNota: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        codVerificacao: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        protocolo: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        rps: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        cancelada: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        datacancelamento: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        empresaId: {
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
        // status não é persistido, poderia ser virtual se necessário
      },
      {
        sequelize,
        tableName: "NotaFiscal",
        modelName: "NotaFiscal",
        freezeTableName: true,
      }
    );

    return NotaFiscal;
  }
}

export default NotaFiscal;
