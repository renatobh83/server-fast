import "dotenv/config";
import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import fastifyEnv from "@fastify/env";
import jwt from "@fastify/jwt";
import routes from "../routes";
import fastifyModule from "../lib/fastifyPlugins/fastifyModule";
import { initSocket, setupSocketListeners } from "../lib/socket";
import { configSchema } from "./configSchema";
import { redisPlugin } from "../lib/fastifyPlugins/redis";
import { sequelizePlugin } from "../lib/fastifyPlugins/sequelize";

export async function buildServer(
  config: FastifyServerOptions = {}
): Promise<FastifyInstance> {
  const server = Fastify({
    logger: true,
    trustProxy: true,
  });

  await server.register(fastifyEnv, {
    dotenv: true, // lê automaticamente do arquivo .env
    schema: configSchema,
  });

  await server.register(redisPlugin);
  await server.register(fastifyModule);
  await server.register(sequelizePlugin);

  await server.register(jwt, {
    secret: process.env.JWT_SECRET!, // coloque em variável de ambiente no mundo real
  });
  server.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    // Se for erro de CORS ou validação, não mata o servidor
    if (error.code === "FST_CORS_ERROR") {
      return reply.status(400).send({ error: "CORS não permitido" });
    }

    reply.status(error.statusCode || 500).send({
      error: error.message || "Erro interno no servidor",
    });
  });

  // decorador para verificar se o usuário está autenticado
  server.decorate("authenticate", async function (request: any, reply: any) {
    try {
      await request.jwtVerify(); // verifica o token
    } catch (err) {
      console.error("JWT ERROR:", err);
      reply.status(401).send({ error: "Token inválido", details: err });
    }
  });

  await server.register(routes);

  server.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: "Not Found",
      message: `A rota ${request.url} não existe`,
    });
  });

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      try {
        await server.close();
        server.log.error(`Closed application on ${signal}`);
        process.exit(0);
      } catch (err: any) {
        server.log.error(`Error closing application on ${signal}`, err);
        process.exit(1);
      }
    });
  });
  return server;
}
export async function start() {
  const app = await buildServer({
    logger: {
      level: "error",
      transport: {
        target: "pino-pretty",
      },
    },
  });

  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });

    initSocket(app.server);
    setupSocketListeners();
    console.log("Server listening on http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  // não encerra a aplicação, só loga
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // em prod pode logar em arquivo/monitoramento
});
export default buildServer;
