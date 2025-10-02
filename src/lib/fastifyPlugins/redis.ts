import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { registerBullMQ } from "../../app/bull";
import { redisClient } from "../redis";

export const redisPlugin = fp(async (fastify: FastifyInstance) => {
  redisClient.on("ready", () => {
    fastify.log.info("✅ Redis conectado e pronto, registrando Workes");
    fastify.register(registerBullMQ);
    fastify.decorate("redis", redisClient);
  });
});
