import fp from "fastify-plugin";
import { Sequelize } from "sequelize";
import { initModels } from "../../models";
import { models, sequelize } from "../../database/db";
import { FastifyInstance } from "fastify";

// Função de retry isolada
async function connectWithRetry(fastify: FastifyInstance, delay = 5000) {
  while (true) {
    try {
      await sequelize.authenticate();
      fastify.log.info("✅ Conexão com Sequelize estabelecida!");
      break;
    } catch (err: any) {
      fastify.log.error("❌ Erro ao conectar no Sequelize:", err.message);
      fastify.log.info(`🔄 Tentando novamente em ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export const sequelizePlugin = fp(
  async (fastify, opts) => {
    // conecta antes de continuar o fluxo do Fastify
    await connectWithRetry(fastify, 5000);

    // adiciona instâncias no fastify
    fastify.decorate("sequelize", sequelize);
    fastify.decorate("models", models);

    // encerra conexão quando o servidor fechar
    fastify.addHook("onClose", async () => {
      await sequelize.close();
      fastify.log.info("🔌 Conexão com Sequelize fechada.");
    });
  },
  {
    name: "sequelize-auto-2", // nome do plugin (importante para logs e erros)
  }
);

// tipagem para fastify
declare module "fastify" {
  interface FastifyInstance {
    sequelize: Sequelize;
    models: ReturnType<typeof initModels>;
  }
}
