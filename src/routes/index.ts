import type { FastifyInstance } from "fastify";
import userRoutes from "./user";
import authRoutes from "./authRoutes";
import tenantRoutes from "./tenantRoutes";
import adminRoutes from "./adminRoutes";
import apiConfiRoutes from "./apiConfigRoutes";
import chamadoRoutes from "./chamadosRoutes";

async function routes(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: "/auth" });

  fastify.register(async (privateScope) => {
    privateScope.addHook("preHandler", fastify.authenticate);

    fastify.register(tenantRoutes, { prefix: "/tenants" });
    fastify.register(adminRoutes, { prefix: "/admin" });
    fastify.register(userRoutes, { prefix: "/users" });
    fastify.register(apiConfiRoutes);
    fastify.register(chamadoRoutes);
  });
}

export default routes;
