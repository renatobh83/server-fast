import { FastifyInstance } from "fastify";
import * as TicketsController from "../controller/TicketsController";

export default async function ticketRoutes(fastify: FastifyInstance) {
  fastify.post("/tickets", TicketsController.createTicket);
  fastify.get("/tickets", TicketsController.listarTickets);
  fastify.delete("/tickets/:ticketId", TicketsController.apagarTicket);
  fastify.get("/tickets/:ticketId", TicketsController.mostrarTicket);
  fastify.put("/tickets/:ticketId", TicketsController.updateTicket);
}
