import type { FastifyInstance } from "fastify";
import serverRoutes from "./server";
import userRoutes from "./user";
import authRoutes from "./authRoutes";
import tenantRoutes from "./tenant";
import { checkValidUser } from "../middleware/auth.helper";

async function routes(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: "/auth" });

  fastify.register(async (privateScope) => {
    privateScope.addHook("preHandler", fastify.authenticate);
    
    fastify.register(tenantRoutes, { prefix: "/tenants" });
  
    fastify.register(userRoutes, {prefix: "/user"})

  });
}

export default routes;
