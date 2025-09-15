import { Sequelize, DataTypes, Model } from "sequelize";
import Contact from "./Contact";
import Tag from "./Tag";
import Tenant from "./Tenant";

interface IContactTag {
  id?: number;
  contactId: number;
  tagId: number;
  tenantId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class ContactTag extends Model<IContactTag> implements IContactTag {
  declare id: number;
  declare contactId: number;
  declare tagId: number;
  declare tenantId: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare contact?: Contact;
  declare tag?: Tag;
  declare tenant?: Tenant;

  static associate(models: any) {
    ContactTag.belongsTo(models.Contact, {
      foreignKey: "contactId",
      as: "contact",
    });
    // ContactTag.belongsTo(models.Tag, { foreignKey: "tagId", as: "tag" });
    ContactTag.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
  }

  static initModel(sequelize: Sequelize): typeof ContactTag {
    ContactTag.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        contactId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        tagId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        tenantId: {
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
      },
      {
        sequelize,
        tableName: "ContactTag",
        modelName: "ContactTag",
        freezeTableName: true,
      }
    );

    return ContactTag;
  }
}

export default ContactTag;
