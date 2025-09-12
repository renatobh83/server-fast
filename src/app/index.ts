import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import fastifyEnv from "@fastify/env";
import fastifySocketIO from "fastify-socket.io";
import jwt from "@fastify/jwt";
import routes from "../routes";
import fastifyModule from "../lib/fastifyPlugins/fastifyModule";
import { initIO } from "../lib/socket";
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
    secret: "DPHmNRZWZ4isLF9vXkMv1QabvpcA80Rc", // coloque em variável de ambiente no mundo real
  });
  // decorador para verificar se o usuário está autenticado
  server.decorate("authenticate", async function (request: any, reply: any) {
    try {
      await request.jwtVerify(); // verifica o token
    } catch (err) {
      reply.send(err);
    }
  });
  // Registra o plugin fastify-socket.io
  await server.register(fastifySocketIO, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },

    transports: ["websocket", "polling"],
    allowEIO3: true,
  });
  server.ready(async (err) => {
    if (err) {
      console.error("Erro ao inicializar servidor:", err);
      return;
    }
    // Acessa a instância do Socket.IO através de server.io
    // initIO(server);
  });
  await server.register(routes);
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
    console.log("Server listening on http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

export default buildServer;
