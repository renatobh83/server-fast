import type { FastifyInstance } from "fastify";
import userRoutes from "./userRoutes";
import authRoutes from "./authRoutes";
import tenantRoutes from "./tenantRoutes";
import adminRoutes from "./adminRoutes";
import apiConfiRoutes from "./apiConfigRoutes";
import chamadoRoutes from "./chamadosRoutes";
import contactRoutes from "./contactRoutes";
import empresaRoutes from "./emrpesaRoutes";
import fastReplyRoutes from "./fastReplyRoutes";
import settginsRoutes from "./settingsRoutes";
import emailRoutes from "./emilRoutes";
import queueRoutes from "./queuRoutes";
import { whastappRoutes } from "./whatsappRoutes";

async function routes(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: "/auth" });

  fastify.register(async (privateScope) => {
    privateScope.addHook("preHandler", fastify.authenticate);

    fastify.register(tenantRoutes, { prefix: "/tenants" });
    fastify.register(adminRoutes, { prefix: "/admin" });
    fastify.register(userRoutes, { prefix: "/users" });
    fastify.register(apiConfiRoutes);
    fastify.register(chamadoRoutes);
    fastify.register(contactRoutes);
    fastify.register(empresaRoutes);
    fastify.register(fastReplyRoutes);
    fastify.register(settginsRoutes);
    fastify.register(emailRoutes);
    fastify.register(queueRoutes);
    fastify.register(whastappRoutes);
  });
}

export default routes;
