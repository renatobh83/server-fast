import { FastifyInstance } from "fastify";
import * as QueueController from "../controller/QueueController";

export default async function queueRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/queue",
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
  fastify.get("/queue", QueueController.listFilas);
  fastify.delete("/queue/:queueId", QueueController.deleteFila);
  fastify.put(
    "/queue/:queueId",
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
}
