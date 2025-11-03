import { FastifyInstance } from "fastify";
import * as FastReplyController from "../controller/FastReplyController";

export default async function fastReplyRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.get("/", FastReplyController.listaFastReply);
  fastify.post(
    "/",
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
    "/:fastReplyId",
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
  fastify.delete("/:fastReplyId", FastReplyController.deleteFastReply);
  done();
}
