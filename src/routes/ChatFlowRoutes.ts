import { FastifyInstance } from "fastify";
import * as ChatFlowController from "../controller/ChatFlowController";

export default async function chatFlowRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/chat-flow",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "flow"],
          properties: {
            name: { type: "string" },
            flow: { type: "object" },
            celularTeste: { type: "string" },
          },
        },
      },
    },
    ChatFlowController.createChatFlow
  );
  fastify.get("/chat-flow", ChatFlowController.listAllChatFlow);
  fastify.delete("/chat-flow/:chatFlowId", ChatFlowController.removeChatFlow);
  fastify.put(
    "/chat-flow/:chatFlowId",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "flow"],
          properties: {
            name: { type: "string" },
            flow: { type: "object" },
            celularTeste: { type: "string" },
            isActive: { type: "boolean" },
          },
        },
      },
    },
    ChatFlowController.updateChatFlow
  );
  fastify.get("/chat-flow-export/:chatFlowId", ChatFlowController.exportFlow);
  fastify.put("/chat-flow-import/:chatFlowId", ChatFlowController.importFlow);
}
