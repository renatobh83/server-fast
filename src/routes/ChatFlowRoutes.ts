import { FastifyInstance } from "fastify";
import * as ChatFlowController from "../controller/ChatFlowController";

export default async function chatFlowRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.post(
    "/",
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
  fastify.get("/", ChatFlowController.listAllChatFlow);
  fastify.delete("/:chatFlowId", ChatFlowController.removeChatFlow);
  fastify.put(
    "/:chatFlowId",
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
  done();
}
