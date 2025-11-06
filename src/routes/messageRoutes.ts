import { FastifyInstance } from "fastify/types/instance";
import * as MessageController from "../controller/MessageController";

export default async function messageRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.get("/:ticketId", MessageController.listMessages);
  fastify.post("/:ticketId", MessageController.createMessages);
  fastify.post("/reaction/:messageid", MessageController.messageReaction);
  fastify.post("/forward-messages", MessageController.forward);
  fastify.post("/startTyping/:ticketId", MessageController.startTyping);
  fastify.post("/stopTyping/:ticketId", MessageController.stopTyping);
  done();
}
