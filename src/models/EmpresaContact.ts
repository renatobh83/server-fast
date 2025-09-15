import { Sequelize, DataTypes, Model } from "sequelize";

interface IEmpresaContact {
  empresaId: number;
  contactId: number;
}

class EmpresaContact extends Model<IEmpresaContact> implements IEmpresaContact {
  declare empresaId: number;
  declare contactId: number;

  static associate(models: any) {
    EmpresaContact.belongsTo(models.Empresa, {
      foreignKey: "empresaId",
      as: "empresa",
    });
    EmpresaContact.belongsTo(models.Contact, {
      foreignKey: "contactId",
      as: "contact",
    });
  }

  static initModel(sequelize: Sequelize): typeof EmpresaContact {
    EmpresaContact.init(
      {
        empresaId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Empresas",
            key: "id",
          },
        },
        contactId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Contacts",
            key: "id",
          },
        },
      },
      {
        sequelize,
        tableName: "EmpresaContacts",
        modelName: "EmpresaContact",
        freezeTableName: true,
        timestamps: false, // Como não há createdAt/updatedAt no modelo original
      }
    );

    return EmpresaContact;
  }
}

export default EmpresaContact;
