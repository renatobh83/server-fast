import { FastifyInstance } from "fastify";
import * as TicketsController from "../controller/TicketsController";

export default async function ticketRoutes(fastify: FastifyInstance) {
  fastify.get("/tickets", TicketsController.listarTickets);
  fastify.get("/tickets/:ticketId", TicketsController.mostrarTicket);
  fastify.post(
    "/tickets",
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
    "/tickets/:ticketId",
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
    TicketsController.updateTicket
  );
  fastify.delete("/tickets/:ticketId", TicketsController.apagarTicket);
}
