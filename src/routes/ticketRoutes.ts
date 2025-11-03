import { FastifyInstance } from "fastify";
import * as TicketsController from "../controller/TicketsController";

export default async function ticketRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.get("/", TicketsController.listarTickets);
  fastify.get("/:ticketId", TicketsController.mostrarTicket);
  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["contactId", "channel"],
          properties: {
            contactId: { type: "string" },
            channel: { type: "string" },
            status: { type: "string" },
            channelId: { type: "number" },
            isTransference: { type: "boolean" },
          },
        },
      },
    },
    TicketsController.createTicket
  );
  fastify.put(
    "/:ticketId",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            contactId: { type: "string" },
            channel: { type: "string" },
            status: { type: "string" },
            channelId: { type: "number" },
            isTransference: { type: "boolean" },
          },
        },
      },
    },
    TicketsController.updateTicket
  );
  fastify.delete("/:ticketId", TicketsController.apagarTicket);
  done();
}
