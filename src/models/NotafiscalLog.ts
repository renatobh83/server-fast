import { Sequelize, DataTypes, Model } from "sequelize";
interface NotaFiscalLogProps {
  id?: number;
  codigo: string;
  numeroRps: string;
  createdAt?: Date;
  updatedAt?: Date;
  mensagem: string;
}

class NotaFiscalLog
  extends Model<NotaFiscalLogProps>
  implements NotaFiscalLogProps
{
  declare id: number;
  declare codigo: string;
  declare numeroRps: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare mensagem: string;

  static initModel(sequelize: Sequelize): typeof NotaFiscalLog {
    NotaFiscalLog.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        codigo: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        numeroRps: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        mensagem: {
          type: DataTypes.STRING,
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
        tableName: "NotaFiscalLog",
        modelName: "NotaFiscalLog",
        freezeTableName: true,
      }
    );

    return NotaFiscalLog;
  }
}

export default NotaFiscalLog;
