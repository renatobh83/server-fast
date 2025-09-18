import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";
import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";

export const createCanal = async (
  request: FastifyRequest<{
    Body: {
      name: string;
      tokenTelegram: string;
      instagramUser: string;
      instagramKey: string;
      type: "waba" | "instagram" | "telegram" | "whatsapp";
      wabaBSP: string;
      tokenAPI: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { tenantId } = request.user as any;
    const payload = { ...request.body, status: "DISCONNECTED", tenantId };
    const createdChannel = await CreateWhatsAppService(payload);
    return reply.code(STANDARD.OK.statusCode).send(createdChannel);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const listaCanais = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { tenantId } = request.user as any;
    const channels = await ListWhatsAppsService(tenantId);
    return reply.code(STANDARD.OK.statusCode).send(channels);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const detalhesCanal = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { tenantId } = request.user as any;
    const { whatsappId } = request.params as any;
    const channel = await ShowWhatsAppService({ tenantId, id: whatsappId });
    return reply.code(STANDARD.OK.statusCode).send(channel);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const updateCanal = async (
  request: FastifyRequest<{
    Body: {
      name: string;
      type: "waba" | "instagram" | "telegram" | "whatsapp";
      status: string;
      isDefault: boolean;
      session: string;
      tokenTelegram: string;
      isActive: boolean;
      wppUser: string;
      wabaBSP: string;
      tokenAPI: string;
      pairingCodeEnabled: boolean;
      chatFlowId: number;
      qrcode: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { tenantId } = request.user as any;
    const { whatsappId } = request.params as any;
    const payload = { whatsappData: request.body, tenantId, whatsappId };
    const channel = await UpdateWhatsAppService(payload);
    return reply.code(STANDARD.OK.statusCode).send(channel);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const deletarCanal = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { tenantId } = request.user as any;
    const { whatsappId } = request.params as any;
    await DeleteWhatsAppService(whatsappId, tenantId);
    return reply.code(STANDARD.OK.statusCode).send({ message: "Sucess" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};
