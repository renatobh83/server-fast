import { Sequelize, DataTypes, Model } from "sequelize";
interface IContactCustomField {
  id?: number;
  name: string;
  value: string;
  contactId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class ContactCustomField
  extends Model<IContactCustomField>
  implements IContactCustomField
{
  declare id: number;
  declare name: string;
  declare value: string;
  declare contactId: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Associações
  static associate(models: any) {
    ContactCustomField.belongsTo(models.Contact, {
      foreignKey: "contactId",
      as: "contact",
    });
  }

  // Init no padrão initModel
  static initModel(sequelize: Sequelize): typeof ContactCustomField {
    ContactCustomField.init(
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
        value: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        contactId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Contacts", // nome da tabela
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
        tableName: "ContactCustomFields",
        modelName: "ContactCustomField",
        freezeTableName: true,
      }
    );

    return ContactCustomField;
  }
}

export default ContactCustomField;
