import { Sequelize, DataTypes, Model } from "sequelize";
import { compare, hash } from "bcryptjs";

export class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare status: string | null;
  declare password?: string; // VIRTUAL
  declare passwordHash?: string;
  declare tokenVersion: number;
  declare profile?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare ativo: boolean;
  declare tenantId: number;
  declare lastLogin?: Date;
  declare lastOnline?: Date;
  declare lastLogout?: Date;
  declare isOnline: boolean;
  declare configs: object;

  // Métodos de instância
  public async checkPassword(password: string): Promise<boolean> {
    const passwordHash = this.getDataValue("passwordHash");
    // if (typeof passwordHash !== "string") throw new AppError("ERRO_HASH_PASSWORD", 404);
    return compare(password, passwordHash);
  }

  // Associações (serão definidas depois)
  public static associate(models: any) {
    User.hasMany(models.Ticket, { foreignKey: "userId" });
    User.hasMany(models.Chamado, { foreignKey: "userId" });
    User.belongsToMany(models.Queue, {
      through: models.UsersQueues,
      foreignKey: "userId",
      otherKey: "queueId",
    });
    User.belongsToMany(models.Contact, {
      through: models.Ticket,
      foreignKey: "userId",
      otherKey: "contactId",
    });
    User.belongsTo(models.Tenant, { foreignKey: "tenantId" });
  }
}

export const initUserModel = (sequelize: Sequelize) => {
  User.init(
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
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.VIRTUAL,
        allowNull: false,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tokenVersion: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      profile: {
        type: DataTypes.STRING,
      },
      createdAt: {
        type: DataTypes.DATE(6),
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE(6),
        defaultValue: DataTypes.NOW,
      },
      ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastOnline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastLogout: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      configs: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      sequelize,
      tableName: "Users",
      freezeTableName: true,
      hooks: {
        beforeCreate: async (user: User) => {
          if (user.password) {
            user.passwordHash = await hash(user.password, 8);
          }
        },
        beforeUpdate: async (user: User) => {
          if (user.password) {
            user.passwordHash = await hash(user.password, 8);
          }
        },
      },
    }
  );

  return User;
};

export default User;
