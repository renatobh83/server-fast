import { FastifyReply, FastifyRequest } from "fastify";
import { handleServerError } from "../errors/errors.helper";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { STANDARD } from "../constants/request";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import { removeWbot } from "../lib/wbot";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import { getIO } from "../lib/socket";
import { getTbot, removeTbot } from "../lib/tbot";
import { logger } from "../utils/logger";

export const startSessionChannel = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { whatsappId } = request.params as any;
  const { tenantId } = request.user as any;
  try {
    const channel = await ShowWhatsAppService({ id: whatsappId, tenantId });
    StartWhatsAppSession(channel);
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "Starting session." });
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const updateSessionChannel = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { whatsappId } = request.params as any;
  const { tenantId } = request.user as any;
  const { isQrcode, id } = request.body as any;
  try {
    if (isQrcode) {
      await removeWbot(id);
    }
    const { whatsapp } = await UpdateWhatsAppService({
      whatsappId,
      whatsappData: {
        status: "DISCONNECTED",
        qrcode: "",
        retries: 0,
        phone: "",
        session: "",
      },
      tenantId,
    });

    StartWhatsAppSession(whatsapp);
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "Starting session." });
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const removeSessionChannel = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { whatsappId } = request.params as any;
  const { tenantId } = request.user as any;
  const { isQrcode, id } = request.body as any;
  try {
    if (isQrcode) {
      await removeWbot(id);
    }
    const channel = await ShowWhatsAppService({ id: whatsappId, tenantId });
    const io = getIO();
    if (channel.type === "whatsapp") {
      await removeWbot(channel.id);
    }
    if (channel.type === "telegram") {
      const tbot = getTbot(channel.id);
      await tbot.telegram
        .logOut()
        .catch((error) =>
          logger.error("Erro ao fazer logout da conexão", error)
        );
      removeTbot(channel.id);
    }
    await channel.update({
      status: "DISCONNECTED",
      session: "",
      qrcode: null,
      retries: 0,
    });
    io.emit(`${channel.tenantId}:whatsappSession`, {
      action: "update",
      session: channel,
    });
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "Session disconnected." });
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
