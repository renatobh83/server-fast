import fp from "fastify-plugin";
import Redis, { RedisOptions } from "ioredis";
import { FastifyInstance } from "fastify";
import { initQueues, processQueues } from "../Queue";
import { registerBullMQ } from "../../app/bull";

export const redisPlugin = fp(async (fastify: FastifyInstance) => {
  const options: RedisOptions = {
    port: Number(fastify.config.IO_REDIS_PORT) || 6379,
    host: fastify.config.IO_REDIS_SERVER,
    db: Number(fastify.config.IO_REDIS_DB_SESSION) || 5,
    maxRetriesPerRequest: null,
  };

  if (fastify.config.IO_REDIS_PASSWORD) {
    options.password = fastify.config.IO_REDIS_PASSWORD;
  }

  const client = new Redis(options);

  // expõe o client como fastify.redis
  fastify.decorate("redis", client);

  fastify.register(async (fastify) => {
    initQueues(fastify); // cria as filas com o Redis do Fastify
    processQueues(5); // inicia os workers
  });

  fastify.register(registerBullMQ);

  // fecha a conexão no shutdown
  fastify.addHook("onClose", async (instance) => {
    await client.quit();
  });
});
