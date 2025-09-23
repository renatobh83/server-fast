import { FastifyInstance } from "fastify";
import * as ChatClientController from "../controller/ChatClientController";

export default async function chatRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/chatClient/token",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "email", "identifier"],
          properties: {
            name: { type: "string" },
            identifier: { type: "number" },
            email: { type: "string", format: "email" },
          },
        },
      },
    },
    ChatClientController.createTokenChatClient
  );
  fastify.post("/chatClient/upload", ChatClientController.storeFileChatClient);
  fastify.get("/chat-widget.js", ChatClientController.widgetChatClient);
}
