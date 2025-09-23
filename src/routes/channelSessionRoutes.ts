import { FastifyInstance } from "fastify";
import * as ChannelSessionController from "../controller/ChannelSessionController";

export default async function channelRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/whatsappsession/:whatsappId",
    ChannelSessionController.startSessionChannel
  );
}
