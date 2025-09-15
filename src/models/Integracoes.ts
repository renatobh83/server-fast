import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import Tenant from "./Tenant";

interface IntegracoesAttributes {
  id: number;
  name: string;
  config_json: object;
  tenantId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Campos opcionais na criação
type IntegracoesCreationAttributes = Optional<
  IntegracoesAttributes,
  "id" | "createdAt" | "updatedAt"
>;

class Integracoes
  extends Model<IntegracoesAttributes, IntegracoesCreationAttributes>
  implements IntegracoesAttributes
{
  declare id: number;
  declare name: string;
  declare config_json: object;
  declare tenantId: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare tenant?: Tenant;

  static associate(models: any) {
    Integracoes.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
  }

  static initModel(sequelize: Sequelize): typeof Integracoes {
    Integracoes.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        config_json: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
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
        tableName: "Integracoes",
        modelName: "Integracoes",
        freezeTableName: true,
      }
    );

    return Integracoes;
  }
}

export default Integracoes;
