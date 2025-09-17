import { Sequelize } from "sequelize";
import { initModels } from "../models";
import "dotenv/config"; // carrega todas variáveis do .env

const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT as any, // ex: "postgres"
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  logging: false,
});

export const models = initModels(sequelize);
export { sequelize };
