import { Sequelize, DataTypes, Model } from "sequelize";
import Contact from "./Contact";
import User from "./User";
import Tenant from "./Tenant";

interface IContactWallet {
  id?: number;
  contactId: number;
  walletId: number;
  tenantId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class ContactWallet extends Model<IContactWallet> implements IContactWallet {
  declare id: number;
  declare contactId: number;
  declare walletId: number;
  declare tenantId: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare contact?: Contact;
  declare wallet?: User;
  declare tenant?: Tenant;

  static associate(models: any) {
    ContactWallet.belongsTo(models.Contact, {
      foreignKey: "contactId",
      as: "contact",
    });
    ContactWallet.belongsTo(models.User, {
      foreignKey: "walletId",
      as: "wallet",
    });
    ContactWallet.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
  }

  static initModel(sequelize: Sequelize): typeof ContactWallet {
    ContactWallet.init(
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
        walletId: {
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
        tableName: "ContactWallet",
        modelName: "ContactWallet",
        freezeTableName: true,
      }
    );

    return ContactWallet;
  }
}

export default ContactWallet;
