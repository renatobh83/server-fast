import { Sequelize, DataTypes, Model } from "sequelize";

interface IEmpresaContrato {
  id?: number;
  empresaId: number;
  tenantId: number;
  totalHoras: number;
  dataContrato: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class EmpresaContrato
  extends Model<IEmpresaContrato>
  implements IEmpresaContrato
{
  declare id: number;
  declare empresaId: number;
  declare tenantId: number;
  declare totalHoras: number;
  declare dataContrato: Date;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    EmpresaContrato.belongsTo(models.Empresa, {
      foreignKey: "empresaId",
      as: "empresa",
    });
    EmpresaContrato.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
  }

  static initModel(sequelize: Sequelize): typeof EmpresaContrato {
    EmpresaContrato.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        empresaId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Empresas",
            key: "id",
          },
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Tenants",
            key: "id",
          },
        },
        dataContrato: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        totalHoras: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "EmpresaContrato",
        modelName: "EmpresaContrato",
        freezeTableName: true,
        timestamps: true,
      }
    );

    return EmpresaContrato;
  }
}

export default EmpresaContrato;
