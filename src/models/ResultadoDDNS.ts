import { Sequelize, DataTypes, Model } from "sequelize";
import Empresa from "./Empresa";

interface IResultadoDDNS {
  id?: number;
  empresaId: number;
  status: string;
  verificadoEm: Date;
  dominio: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class ResultadoDDNS extends Model<IResultadoDDNS> implements IResultadoDDNS {
  declare id: number;
  declare empresaId: number;
  declare status: string;
  declare verificadoEm: Date;
  declare dominio: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare empresa?: Empresa;

  static associate(models: any) {
    ResultadoDDNS.belongsTo(models.Empresa, {
      foreignKey: "empresaId",
      as: "empresa",
    });
  }

  static initModel(sequelize: Sequelize): typeof ResultadoDDNS {
    ResultadoDDNS.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        empresaId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        dominio: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        verificadoEm: {
          type: DataTypes.DATE,
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
      },
      {
        sequelize,
        tableName: "ResultadoDDNS",
        modelName: "ResultadoDDNS",
        freezeTableName: true,
      }
    );

    return ResultadoDDNS;
  }
}

export default ResultadoDDNS;
