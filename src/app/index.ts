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
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      statusCode,
      error: error.name || "Internal Server Error",
      message: error.message,
    });
  });

  // decorador para verificar se o usuário está autenticado
  server.decorate("authenticate", async function (request: any, reply: any) {
    try {
      await request.jwtVerify(); // verifica o token
    } catch (err) {
      reply.send(err);
    }
  });
  if (!server.hasRequestDecorator("user")) {
    server.decorateRequest("user", null as any);
  }

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
// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

export default buildServer;
