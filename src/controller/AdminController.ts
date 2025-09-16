import { FastifyRequest, FastifyReply } from "fastify";
import AdminListSettingsService from "../services/AdminServices/AdminListSettingsServices";
import { STANDARD } from "../constants/request";
import ListChatFlowService from "../services/AdminServices/AdminListChatFlowService";
import AdminListUsersService from "../services/AdminServices/AdminListUsersService";
import { tryCatch } from "bullmq";
import { handleServerError } from "../errors/errors.helper";

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
  const { tenantId } = request.user as any;

  const listChatFlow = await ListChatFlowService({ tenantId });

  return reply.code(STANDARD.OK.statusCode).send(listChatFlow);
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
    console.log(error);
    return handleServerError(reply, error);
  }
};
