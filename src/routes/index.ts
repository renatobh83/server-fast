// import type { FastifyInstance } from "fastify";
// import userRoutes from "./userRoutes";
// import authRoutes from "./authRoutes";
// import tenantRoutes from "./tenantRoutes";
// import adminRoutes from "./adminRoutes";
// import apiConfiRoutes from "./apiConfigRoutes";
// import chamadoRoutes from "./chamadosRoutes";
// import contactRoutes from "./contactRoutes";
// import empresaRoutes from "./empresaRoutes";
// import fastReplyRoutes from "./fastReplyRoutes";
// import settginsRoutes from "./settingsRoutes";
// import emailRoutes from "./emilRoutes";
// import queueRoutes from "./queuRoutes";
// import { whastappRoutes } from "./whatsappRoutes";
// import ticketRoutes from "./ticketRoutes";
// import statisticsRoutes from "./statisticsRoutes";
// import integtracaoRoutes from "./integracaoRoutes";
// import notaFiscalRoutes from "./notafiscalRoutes";
// import messageRoutes from "./messageRoutes";
// import channelRoutes from "./channelSessionRoutes";
// import chatRoutes from "./chatClientRoutes";
// import chatFlowRoutes from "./ChatFlowRoutes";
// import apiExternaRoutes from "./apiExternaRoutes";
// import auxiliarRoutes from "./auxiliarRoutes";
// import aplicationRoutes from "./aplicationRoutes";

// async function routes(fastify: FastifyInstance) {
//   fastify.register(authRoutes, { prefix: "/auth" });
//   fastify.register(chatRoutes, { prefix: "/api" });
//   fastify.register(apiExternaRoutes, { prefix: "/v1/api/external" });
//   fastify.register(auxiliarRoutes);

//   fastify.register(async (privateScope) => {
//     privateScope.addHook("preHandler", fastify.authenticate);
//     fastify.register(aplicationRoutes);
//     fastify.register(tenantRoutes, { prefix: "/tenants" });
//     fastify.register(adminRoutes, { prefix: "/admin" });
//     fastify.register(userRoutes, { prefix: "/users" });
//     fastify.register(messageRoutes, { prefix: "/messages" });
//     fastify.register(apiConfiRoutes);
//     fastify.register(chamadoRoutes);
//     fastify.register(contactRoutes);
//     fastify.register(empresaRoutes);
//     fastify.register(fastReplyRoutes);
//     fastify.register(settginsRoutes);
//     fastify.register(emailRoutes);
//     fastify.register(queueRoutes);
//     fastify.register(whastappRoutes);
//     fastify.register(ticketRoutes);
//     fastify.register(statisticsRoutes);
//     fastify.register(integtracaoRoutes);
//     fastify.register(notaFiscalRoutes);
//     fastify.register(channelRoutes);
//     fastify.register(chatFlowRoutes);
//   });
// // }

// // export default routes;
