import { DataTypes, Model, Sequelize } from "sequelize";

class Module extends Model {
  declare id: string;
  declare name: string;
  declare is_active: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  static initModel(sequelize: Sequelize): typeof Module {
    Module.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4, // gera novo UUID automaticamente
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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
        tableName: "Modules",
        modelName: "Module",
        timestamps: true,
        freezeTableName: true,
      }
    );

    return Module;
  }

  // Nenhuma associação direta neste caso,
  // mas deixamos o método pronto para manter o padrão do projeto
  static associate() {
    // Exemplo (se futuramente tiver relação com outras tabelas):
    // Module.hasMany(Route, { foreignKey: "moduleId", as: "routes" });
  }
}

export default Module;
