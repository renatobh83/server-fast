import { Sequelize, DataTypes, Model } from "sequelize";
import { compare, hash } from "bcryptjs";
interface UserProps {
  id?: number;
  name: string;
  email: string;
  status?: string | null;
  password?: string; // VIRTUAL
  passwordHash: string;
  tokenVersion?: number;
  profile?: string;
  createdAt?: Date;
  updatedAt?: Date;

  ativo?: boolean;
  tenantId: number;
  lastLogin?: Date | null;
  lastOnline?: Date | null;
  lastLogout?: Date | null;
  isOnline?: boolean;
  configs?: object;
}

class User extends Model<UserProps> implements UserProps {
  declare id: number;
  declare name: string;
  declare email: string;
  declare status: string | null;
  declare password?: string;
  declare passwordHash: string;
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

  // método de instância
  public async checkPassword(password: string): Promise<boolean> {
    const passwordHash = this.getDataValue("passwordHash");
    return compare(password, passwordHash);
  }

  // associações
  static associate(models: any) {
    // User.hasMany(models.Ticket, { foreignKey: "userId" });
    // User.hasMany(models.Chamado, { foreignKey: "userId" });
    // User.belongsToMany(models.Queue, {
    //   through: models.UsersQueues,
    //   foreignKey: "userId",
    //   otherKey: "queueId",
    // });
    // User.belongsToMany(models.Contact, {
    //   through: models.Ticket,
    //   foreignKey: "userId",
    //   otherKey: "contactId",
    // });
    User.belongsTo(models.Tenant, { foreignKey: "tenantId" });
  }

  // init separado para seguir o novo padrão
  static initModel(sequelize: Sequelize): typeof User {
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
  }
}

export default User;
