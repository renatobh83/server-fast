import "dotenv/config";
import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifyServerOptions,
} from "fastify";
import fastifyEnv from "@fastify/env";
import jwt from "@fastify/jwt";
// import routes from "../routes";
import fastifyModule from "../lib/fastifyPlugins/fastifyModule";
import { initSocket, setupSocketListeners } from "../lib/socket";
import { configSchema } from "./configSchema";
import { redisPlugin } from "../lib/fastifyPlugins/redis";
import { sequelizePlugin } from "../lib/fastifyPlugins/sequelize";
import { StartAllWhatsAppsSessions } from "../services/WbotServices/StartAllWhatsAppsSessions";
import { shutdown } from "../lib/Queue";
import Setting from "../models/Setting";
import { CheckDDNSservices } from "../services/DnsServices/CheckDDNSservices";
import { scheduleOrUpdateDnsJob } from "../utils/scheduleDnsJob";
import { controlRoutes, routes } from "../routes/moduleRoutes";
import { getModuleStatusByName } from "../services/ModuleServices";

/**
 * Hook preHandler para verificar o status do módulo antes de processar a requisição.
 * Esta função será executada para todas as rotas registradas.
 */
async function checkModuleStatus(request: FastifyRequest, reply: FastifyReply) {
  // A rota de controle e a rota de saúde não devem ser verificadas
  if (request.url.startsWith("/modules") || request.url === "/health") {
    return;
  }

  // Tenta obter o nome do módulo a partir do decorador da instância do Fastify
  // O decorador foi adicionado no plugin de rota do módulo (moduleRoutes.ts)
  const moduleName = request.moduleName;

  if (moduleName) {
    const isActive = await getModuleStatusByName(moduleName);
    if (isActive === null) {
      // Módulo não encontrado no banco de dados
      reply.code(404).send({ error: `Módulo '${moduleName}' não encontrado.` });
    } else if (!isActive) {
      // Módulo encontrado, mas inativo
      reply.code(403).send({
        error: `Acesso negado. O módulo '${moduleName}' está inativo.`,
      });
    }
    // Se isActive for true, a execução continua normalmente
  } else {
    // Se a rota não tiver um moduleName, ela é tratada como uma rota padrão (ex: 404 se não for encontrada)
    // Para este exemplo, vamos apenas deixar passar se não for uma rota de módulo
  }
}

export async function buildServer(
  config: FastifyServerOptions = {}
): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: "error",
      transport: {
        target: "pino-pretty", // saída mais legível
      },
    },
    trustProxy: true, //process.env.NODE_ENV !== "prod"
  });

  await server.register(fastifyEnv, {
    dotenv: true, // lê automaticamente do arquivo .env
    schema: configSchema,
  });

  await server.register(redisPlugin);
  await server.register(fastifyModule);
  await server.register(sequelizePlugin);

  await server.register(jwt, {
    secret: process.env.JWT_SECRET!,
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
  server.addHook("preHandler", checkModuleStatus);

  server.register(controlRoutes);
  // decorador para verificar se o usuário está autenticado
  server.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: any) {
      try {
        await request.jwtVerify(); // verifica o token
      } catch (err: any) {
        request.server.log.error("JWT ERROR:", err);
        reply.status(401).send({ error: "Token inválido", details: err });
      }
    }
  );

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
        await shutdown();
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
  const app = await buildServer();

  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    app.server.keepAliveTimeout = 5 * 60 * 1000;
    initSocket(app.server);
    setupSocketListeners();
    await StartAllWhatsAppsSessions();
    await scheduleOrUpdateDnsJob();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
export default buildServer;
