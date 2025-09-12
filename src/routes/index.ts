import type { FastifyInstance } from "fastify";
import serverRoutes from "./server";
import userRoutes from "./user";
import authRoutes from "./authRoutes";

async function routes(fastify: FastifyInstance) {
  // /users → rotas de usuários

  fastify.register(userRoutes, { prefix: "/users" });

  // /servers → rotas de servidores
  fastify.register(serverRoutes, { prefix: "/servers" });

  fastify.register(authRoutes, { prefix: "/auth" });
}

export default routes;
