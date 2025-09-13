import { Sequelize, DataTypes, Model } from "sequelize";

interface TenantProps {
  id?: number;
  status?: string;
  name: string;
  ownerId: number;
  businessHours: object;
  messageBusinessHours?: string | null;
  address?: object | null;
  dadosNfe?: object | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class Tenant extends Model<TenantProps> implements TenantProps {
  declare id: number;
  declare status: string;
  declare name: string;
  declare ownerId: number;
  declare businessHours: object;
  declare messageBusinessHours: string | null;
  declare address: object | null;
  declare dadosNfe: object | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    // Tenant.hasMany(models.EmpresaContrato, {
    //   foreignKey: "tenantId",
    //   as: "contratos",
    // });

    // Tenant.hasMany(models.Empresa, {
    //   foreignKey: "tenantId",
    //   as: "empresas",
    // });

    Tenant.belongsTo(models.User, {
      foreignKey: "ownerId",
      as: "owner",
    });
  }

  static initModel(sequelize: Sequelize): typeof Tenant {
    Tenant.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "active",
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        ownerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        businessHours: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        messageBusinessHours: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        address: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        dadosNfe: {
          type: DataTypes.JSONB,
          allowNull: true,
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
        tableName: "Tenants",
        freezeTableName: true,
      }
    );

    return Tenant;
  }
}

export default Tenant;
