import fp from "fastify-plugin";
import {Sequelize } from "sequelize";
import { initModels } from "../../models";
import { models, sequelize } from "../../database/db";

export const sequelizePlugin = fp(async (fastify, opts) => {

  try {
    await sequelize.authenticate();
    fastify.log.info("Conexao com Sequelize estabelecida");
  } catch (err: any) {
    fastify.log.error("Erro ao conectar no Sequelize:", err);
    throw err;
  }


  // adiciona ao fastify
  fastify.decorate("sequelize", sequelize);
  fastify.decorate("models", models);

  // desconectar ao encerrar servidor
  fastify.addHook("onClose", async () => {
    await sequelize.close();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    sequelize: Sequelize;
    models: ReturnType<typeof initModels>;
  }
}
