import { FastifyInstance } from "fastify";
import * as QueueController from "../controller/QueueController";

export default async function queueRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["queue", "isActive"],
          properties: {
            queue: { type: "string" },
            isActive: { type: "boolean" },
          },
        },
      },
    },
    QueueController.createFila
  );
  fastify.get("/", QueueController.listFilas);
  fastify.delete("/:queueId", QueueController.deleteFila);
  fastify.put(
    "/:queueId",
    {
      schema: {
        body: {
          type: "object",
          required: ["queue", "isActive"],
          properties: {
            queue: { type: "string" },
            isActive: { type: "boolean" },
          },
        },
      },
    },
    QueueController.updateFila
  );
  done();
}
