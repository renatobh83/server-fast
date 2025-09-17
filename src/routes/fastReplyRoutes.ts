import { FastifyInstance } from "fastify";
import * as FastReplyController from "../controller/FastReplyController";

export default async function fastReplyRoutes(fastify: FastifyInstance) {
  fastify.get("/fastreply", FastReplyController.listaFastReply);
  fastify.post(
    "/fastreply",
    {
      schema: {
        body: {
          type: "object",
          required: ["key", "message"],
          properties: {
            key: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
    FastReplyController.createFastReply
  );
  fastify.put(
    "/fastreply/:fastReplyId",
    {
      schema: {
        body: {
          type: "object",
          required: ["key", "message"],
          properties: {
            key: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
    FastReplyController.updateFastReply
  );
  fastify.delete(
    "/fastreply/:fastReplyId",
    FastReplyController.deleteFastReply
  );
}
