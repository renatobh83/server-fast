import { FastifyInstance } from "fastify";
import * as ChannelSessionController from "../controller/ChannelSessionController";

export default async function channelRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.post("/:whatsappId", ChannelSessionController.startSessionChannel);
  fastify.put("/:whatsappId", ChannelSessionController.updateSessionChannel);
  fastify.delete("/:whatsappId", ChannelSessionController.removeSessionChannel);
}
