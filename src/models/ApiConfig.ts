import {  DataTypes, Model, Sequelize } from "sequelize";
import Tenant from "./Tenant";
import { v4 as uuidV4 } from "uuid";



class ApiConfig extends Model {
    declare id: string;
    declare sessionId: number;
    declare name: string;
    declare token: string;
    declare authToken: string;
    declare urlServiceStatus: string;
    declare urlMessageStatus: string;
    declare userId: number;
    declare tenantId: number;
    declare isActive: boolean
    declare createdAt: Date;
    declare updatedAt: Date;

    static initModel(sequelize: Sequelize): typeof ApiConfig {
        ApiConfig.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: uuidV4,
                primaryKey: true,
            },
            sessionId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "Whatsapp",
                    key: "id",
                },
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            token: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            authToken: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            urlServiceStatus: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            urlMessageStatus: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "User",
                    key: "id",
                },
            },
            tenantId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "Tenant",
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
                tableName: "ApiConfig", // ou "ApiConfigs" se seguir plural
                modelName: "ApiConfig",
                timestamps: true,
                freezeTableName: true,
            })
        return ApiConfig
    }

    static associate(models: any) {
        ApiConfig.belongsTo(Tenant, {
            foreignKey: "tenantId",
            as: "tenant"
        })
    }

}
export default ApiConfig