import { FastifyRequest, FastifyReply } from "fastify";
import AdminListSettingsService from "../services/AdminServices/AdminListSettingsServices";
import { STANDARD } from "../constants/request";
import ListChatFlowService from "../services/AdminServices/AdminListChatFlowService";
import AdminListUsersService from "../services/AdminServices/AdminListUsersService";
import { handleServerError } from "../errors/errors.helper";
import AdminUpdateUserService from "../services/AdminServices/AdminUpdateUserService";
import AdminListTenantsService from "../services/AdminServices/AdminListTenantsService";
import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import AdminListChannelsService from "../services/AdminServices/AdminListChannelsService";
import { logger } from "../utils/logger";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

export const listSettings = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  const listSettings = await AdminListSettingsService(tenantId);

  return reply.code(STANDARD.OK.statusCode).send(listSettings);
};

export const ListChatFlow = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    
    const { tenantId } = request.user as any;
  
    const listChatFlow = await ListChatFlowService({ tenantId });
  
    return reply.code(STANDARD.OK.statusCode).send(listChatFlow);
  } catch (error) {
    logger.error("Error in ListChatFlow",error )
     return handleServerError(reply, error);
  }
};

export const listUsers = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { searchParam, pageNumber } = request.query as IndexQuery;
  try {
    const { users, count, hasMore } = await AdminListUsersService({
      searchParam,
      pageNumber,
    });
    return reply.code(STANDARD.OK.statusCode).send({ users, count, hasMore });
  } catch (error) {
      logger.error("Error in listUsers",error )
    return handleServerError(reply, error);
  }
};

export const updateUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userData = request.body as any;
    const { userId } = request.params as any;

    const userUpdated = await AdminUpdateUserService({ userData, userId });
    return reply.code(200).send(userUpdated);
  } catch (error) {
    logger.error("Error in updateUser",error )
    return handleServerError(reply, error);
  }
};

export const TenantList = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const tenants = await AdminListTenantsService();
    return reply.code(STANDARD.OK.statusCode).send({ tenants });
  } catch (error) {
    logger.error("Error in TenantList",error )
    return handleServerError(reply, error);
  }
};

// Canais
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
    logger.error("Error in createCanal",error )
    return handleServerError(reply, error);
  }
};

export const listaCanais = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { tenantId } = request.user as any;
    const channels = await AdminListChannelsService({ tenantId });
    return reply.code(STANDARD.OK.statusCode).send(channels);
  } catch (error) {
    logger.error("Error in listaCanais",error )
    return handleServerError(reply, error);
  }
};
