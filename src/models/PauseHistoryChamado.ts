import { Sequelize, DataTypes, Model, Optional } from "sequelize";

interface PauseHistoryProps {
  id?: number;
  chamadoId: number;
  startTime: Date;
  endTime?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Se quiser suportar criação sem id/createdAt
type PauseHistoryCreation = Optional<
  PauseHistoryProps,
  "id" | "endTime" | "createdAt" | "updatedAt"
>;

class PauseHistory
  extends Model<PauseHistoryProps, PauseHistoryCreation>
  implements PauseHistoryProps
{
  declare id: number;
  declare chamadoId: number;
  declare startTime: Date;
  declare endTime: Date | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  // associações
  static associate(models: any) {
    PauseHistory.belongsTo(models.Chamado, {
      foreignKey: "chamadoId",
      onDelete: "CASCADE",
    });
  }

  // init separado
  static initModel(sequelize: Sequelize): typeof PauseHistory {
    PauseHistory.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        chamadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        startTime: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        endTime: {
          type: DataTypes.DATE,
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
        tableName: "PauseHistories", // Nome da tabela (ajuste se for diferente no BD)
        freezeTableName: true,
      }
    );

    return PauseHistory;
  }
}

export default PauseHistory;
