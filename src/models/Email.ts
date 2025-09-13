import { DataTypes, Model, Sequelize } from "sequelize";
import Tenant from "./Tenant";

export class Email extends Model {
    declare id: number
    declare tenantId: number;
    declare smtp: string;
    declare senha: string;
    declare email: string;
    declare portaSMTP: number;
    declare ssl: boolean;
    declare tsl: string;

  static initModel(sequelize: Sequelize): typeof Email {
    Email.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        smtp: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        senha: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        portaSMTP: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        ssl: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        tsl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Tenant", // ou "Tenants" se precisar só do nome da tabela
            key: "id",
          },
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
        tableName: "Email", // respeita o freezeTableName
        modelName: "Email",
        timestamps: true,
      }
    );

    return Email;
  }

  static associate() {
    Email.belongsTo(Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
  }
}

export default Email;
