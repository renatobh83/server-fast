import { Sequelize, DataTypes, Model } from "sequelize";

interface IMedia {
  id?: number;
  chamadoId: number;
  url: string;
  type: string;
  dadosenvio: any;
  createdAt?: Date;
  updatedAt?: Date;
}

class Media extends Model<IMedia> implements IMedia {
  declare id: number;
  declare chamadoId: number;
  declare url: string;
  declare type: string;
  declare dadosenvio: any;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    Media.belongsTo(models.Chamado, { foreignKey: "chamadoId", as: "chamado" });
  }

  static initModel(sequelize: Sequelize): typeof Media {
    Media.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        chamadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "Chamados",
            key: "id",
          },
        },
        url: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        dadosenvio: {
          type: DataTypes.JSONB,
          allowNull: false,
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
        tableName: "Media",
        modelName: "Media",
        freezeTableName: true,
        timestamps: true,
      }
    );

    return Media;
  }
}

export default Media;
