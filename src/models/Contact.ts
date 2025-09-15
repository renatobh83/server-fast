import { Sequelize, DataTypes, Model } from "sequelize";

import ContactCustomField from "./ContactCustomField";
import Empresa from "./Empresa";

export interface CreateContactInput {
  id?: number;
  name: string;
  number?: string;
  email?: string;
  profilePicUrl?: string;
  pushname?: string;
  telegramId?: string;
  messengerId?: string;
  instagramPK?: number;
  isUser?: boolean;
  isWAContact?: boolean;
  isGroup?: boolean;
  tenantId: number;
  extraInfo?: ContactCustomField[];
  empresas?: Empresa[];
  dtaniversario?: Date;
  identifier?: string;
  serializednumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class Contact extends Model<CreateContactInput> implements CreateContactInput {
  declare id: number;
  declare name: string;
  declare number?: string;
  declare email?: string;
  declare profilePicUrl?: string;
  declare pushname?: string;
  declare telegramId?: string;
  declare dtaniversario?: Date;
  declare identifier?: string;
  declare serializednumber?: string;
  declare isUser: boolean;
  declare isWAContact: boolean;
  declare isGroup: boolean;
  declare tenantId: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  // ⚡ Associações
  static associate(models: any) {
    Contact.hasMany(models.Ticket, { foreignKey: "contactId" });
    Contact.hasMany(models.ContactCustomField, { foreignKey: "contactId" });

    Contact.belongsToMany(models.Tags, {
      through: models.ContactTag,
      foreignKey: "contactId",
      otherKey: "tagId",
    });

    Contact.belongsToMany(models.User, {
      through: models.ContactWallet,
      foreignKey: "contactId",
      otherKey: "walletId",
    });

    Contact.hasMany(models.ContactWallet, { foreignKey: "contactId" });

    Contact.hasMany(models.CampaignContacts, { foreignKey: "contactId" });

    Contact.belongsToMany(models.Campaign, {
      through: models.CampaignContacts,
      foreignKey: "contactId",
      otherKey: "campaignId",
    });

    Contact.belongsToMany(models.Empresa, {
      through: models.EmpresaContact,
      foreignKey: "contactId",
      otherKey: "empresaId",
    });

    Contact.hasMany(models.Empresa, { foreignKey: "responsavelContactId" });

    Contact.belongsTo(models.Tenant, { foreignKey: "tenantId" });
  }

  // ⚡ init separado no padrão novo
  static initModel(sequelize: Sequelize): typeof Contact {
    Contact.init(
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
        number: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        profilePicUrl: {
          type: DataTypes.STRING,
        },
        pushname: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        telegramId: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        dtaniversario: {
          type: DataTypes.DATE(6),
          allowNull: true,
          defaultValue: null,
        },
        identifier: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        isUser: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        serializednumber: {
          type: DataTypes.STRING,
          defaultValue: "",
        },
        isWAContact: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        isGroup: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        createdAt: {
          type: DataTypes.DATE(6),
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE(6),
          defaultValue: DataTypes.NOW,
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Tenant",
            key: "id",
          },
        },
      },
      {
        sequelize,
        tableName: "Contacts",
        freezeTableName: true,
        hooks: {
          afterCreate: async (contact: Contact) => {
            const normalized = normalizePhoneNumber(contact.number);
            if (contact.number !== normalized) {
              contact.number = normalized;
              await contact.save();
            }
          },
          afterUpdate: async (contact: Contact) => {
            const normalized = normalizePhoneNumber(contact.number);
            if (contact.number !== normalized) {
              contact.number = normalized;
              await contact.save();
            }
          },
        },
      }
    );

    return Contact;
  }
}

// 🔧 Função auxiliar (normalização do telefone)
function normalizePhoneNumber(phone?: string): string | undefined {
  if (!phone) return phone;

  if (phone.endsWith("@g.us")) return phone;

  phone = phone.replace(/@c\.us$/, "");

  if (phone.startsWith("55")) {
    const ddd = phone.substring(2, 4);
    const numberWithoutDDD = phone.substring(4);
    phone = ddd + numberWithoutDDD;
  }

  return phone;
}

export default Contact;
