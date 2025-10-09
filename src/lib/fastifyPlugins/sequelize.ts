// lib/fastifyPlugins/sequelize.ts
import fp from "fastify-plugin";
import { Sequelize } from "sequelize";
import { initModels } from "../../models";
import { models, sequelize } from "../../database/db";
import { FastifyInstance } from "fastify";

// retry inicial sem bloquear o boot do Fastify
async function connectWithRetry(fastify: FastifyInstance, delay = 5000) {
  let connected = false;

  while (!connected) {
    try {
      await sequelize.authenticate();
      fastify.log.info("✅ Conexão com Sequelize estabelecida!");
      connected = true;
    } catch (err: any) {
      fastify.log.error("❌ Erro ao conectar no Sequelize:", err);
      fastify.log.info(`🔄 Tentando novamente em ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// health-check em background (não bloqueia o boot)
function monitorConnection(fastify: FastifyInstance, interval = 10000) {
  setInterval(async () => {
    try {
      await sequelize.authenticate();
      fastify.log.debug("DB check OK");
    } catch (err: any) {
      fastify.log.error("⚠️ DB check falhou, tentando reconectar:", err);
      await connectWithRetry(fastify, 5000);
    }
  }, interval);
}

export const sequelizePlugin = fp(async (fastify) => {
  // inicia conexão (com retry até dar certo)

  await connectWithRetry(fastify, 5000);

  // inicia monitoramento em background
  monitorConnection(fastify, 10000);

  // adiciona no fastify
  fastify.decorate("sequelize", sequelize);
  fastify.decorate("models", models);

  // fecha no shutdown
  fastify.addHook("onClose", async () => {
    await sequelize.close();
    fastify.log.info("🔌 Conexão com Sequelize fechada.");
  });
});

declare module "fastify" {
  interface FastifyInstance {
    sequelize: Sequelize;
    models: ReturnType<typeof initModels>;
  }
}
