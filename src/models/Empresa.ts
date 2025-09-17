import {
  Sequelize,
  DataTypes,
  Model,
  BelongsToManyAddAssociationsMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManySetAssociationsMixin,
} from "sequelize";
import EmpresaContact from "./EmpresaContact";
import Contact from "./Contact";

interface IEmpresa {
  id?: number;
  name: string;
  address?: object;
  identifier?: number;
  active?: boolean;
  tenantId: number;
  acessoExterno?: { ddns: string; ativo: boolean }[];
  empresaContacts?: EmpresaContact[];
  openTicketIds?: number[];
  responsavelContactId?: number;
  resultadoDDNSId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class Empresa extends Model<IEmpresa> implements IEmpresa {
  declare id: number;
  declare name: string;
  declare address?: object;
  declare identifier?: number;
  declare active: boolean;
  declare tenantId: number;
  declare acessoExterno?: { ddns: string; ativo: boolean }[];
  declare empresaContacts?: EmpresaContact[];
  declare openTicketIds?: number[];
  declare responsavelContactId?: number;
  declare resultadoDDNSId?: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare contacts?: Contact[];

  declare addContacts: BelongsToManyAddAssociationsMixin<Contact, number>;
  declare addContat: BelongsToManyAddAssociationMixin<Contact, number>;
  declare getContacts: BelongsToManyGetAssociationsMixin<Contact>;
  declare setContacts: BelongsToManySetAssociationsMixin<Contact, number>;
  declare removeContacts: BelongsToManyRemoveAssociationMixin<Contact, string>;

  static associate(models: any) {
    Empresa.hasMany(models.EmpresaContact, {
      as: "empresaContacts", // mesmo "as" que você usou
      foreignKey: "empresaId",
    });
    Empresa.hasMany(models.EmpresaContrato, { as: "contratos" });

    Empresa.belongsToMany(models.Contact, {
      through: models.EmpresaContact,
      foreignKey: "empresaId",
      otherKey: "contactId",
      as: "contacts",
    });

    Empresa.belongsTo(models.Contact, {
      foreignKey: "responsavelContactId",
      as: "responsavelContact",
    });
    Empresa.belongsTo(models.Tenant, { foreignKey: "tenantId", as: "tenant" });
    Empresa.hasMany(models.Ticket, { as: "tickets" });
    Empresa.belongsTo(models.ResultadoDDNS, {
      foreignKey: "resultadoDDNSId",
      as: "ResultadoDDNS",
    });
  }

  static initModel(sequelize: Sequelize): typeof Empresa {
    Empresa.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        address: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        acessoExterno: {
          type: DataTypes.ARRAY(DataTypes.JSONB),
          allowNull: true,
          defaultValue: [],
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Tenants",
            key: "id",
          },
        },
        identifier: {
          type: DataTypes.BIGINT,
          allowNull: true,
        },
        openTicketIds: {
          type: DataTypes.ARRAY(DataTypes.INTEGER),
          allowNull: true,
          defaultValue: [],
        },
        responsavelContactId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: "Contacts",
            key: "id",
          },
        },
        resultadoDDNSId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: "ResultadoDDNS",
            key: "id",
          },
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
        tableName: "Empresas",
        modelName: "Empresa",
        freezeTableName: true,
      }
    );

    return Empresa;
  }
}

export default Empresa;
