import fp from "fastify-plugin";
import { Dialect, Sequelize } from "sequelize";
import { initUserModel } from "../../models/User";

export const sequelizePlugin = fp(async (fastify, opts) => {
  const sequelize = new Sequelize({
    dialect: fastify.config.DB_DIALECT as Dialect,
    host: fastify.config.POSTGRES_HOST,
    port: fastify.config.DB_PORT,
    database: fastify.config.POSTGRES_DB,
    username: fastify.config.POSTGRES_USER,
    password: fastify.config.POSTGRES_PASSWORD,
    logging: false,
  });

  try {
    await sequelize.authenticate();
    fastify.log.info("Conexao com Sequelize estabelecida");
  } catch (err: any) {
    fastify.log.error("Erro ao conectar no Sequelize:", err);
    throw err;
  }
  const models = {
    User: initUserModel(sequelize),
  };

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
    models: {
      User: ReturnType<typeof initUserModel>;
    };
  }
}
