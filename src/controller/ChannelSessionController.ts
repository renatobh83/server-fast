import { FastifyReply, FastifyRequest } from "fastify";
import { handleServerError } from "../errors/errors.helper";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { STANDARD } from "../constants/request";
import { StartWhatsAppSession } from "../services/StartWhatsAppSession";

export const startSessionChannel = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { whatsappId } = request.params as any;
  const { tenantId } = request.user as any;
  try {
    const channel = await ShowWhatsAppService({ id: whatsappId, tenantId });
    await StartWhatsAppSession(channel);
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "Starting session." });
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
