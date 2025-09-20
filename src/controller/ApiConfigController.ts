import { FastifyReply, FastifyRequest } from "fastify";
import {  ERRORS, handleServerError } from "../errors/errors.helper";
import CreateApiConfigService from "../services/ApiConfigServices/CreateApiConfigService";
import { STANDARD } from "../constants/request";
import ListApiConfigService from "../services/ApiConfigServices/ListApiConfigService";
import UpdateApiConfigService from "../services/ApiConfigServices/UpdateApiConfigService";
import DeleteApiConfigService from "../services/ApiConfigServices/DeleteApiConfigService";
import RenewApiConfigTokenService from "../services/ApiConfigServices/RenewApiConfigTokenService";

interface ApiData {
  name: string;
  sessionId: number;
  urlServiceStatus?: string;
  urlMessageStatus?: string;
  userId: number;
  tenantId: number;
  authToken: string;
  isActive?: boolean;
}

export const createApiConfig = async (
  request: FastifyRequest<{ Body: ApiData }>,
  reply: FastifyReply
) => {
  const { tenantId, id, profile } = request.user as any;

  if (profile !== "admin") {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
  const payload = { ...request.body, userId: id, tenantId };
  try {
    const api = await CreateApiConfigService(payload);
    return reply.code(STANDARD.OK.statusCode).send(api);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const listApiConfig = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, profile } = request.user as any;
  if (profile !== "admin") {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
  try {
    const apiList = await ListApiConfigService({ tenantId });
    return reply.code(STANDARD.OK.statusCode).send(apiList);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const UpdateApiConfig = async (
  request: FastifyRequest<{ Body: ApiData }>,
  reply: FastifyReply
) => {
  const { tenantId, profile, id } = request.user as any;
  if (profile !== "admin") {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
  try {
    const { apiId } = request.params as any;
    const apiData: ApiData = { ...request.body, userId: id, tenantId };
    const api = await UpdateApiConfigService({ apiData, apiId, tenantId });
    return reply.code(STANDARD.OK.statusCode).send(api);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const DeleteApiConfig = async (
  request: FastifyRequest<{ Body: ApiData }>,
  reply: FastifyReply
) => {
  const { tenantId, profile } = request.user as any;
  if (profile !== "admin") {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
  const { apiId } = request.params as any;
  try {
    await DeleteApiConfigService({ apiId, tenantId });
    return reply.code(STANDARD.OK.statusCode).send({ message: "Api Excluida" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};
interface RenewData {
  sessionId: number;
  userId: number;
  tenantId: number;
}

export const RenewTokenApiConfig = async (
  request: FastifyRequest<{ Body: RenewData }>,
  reply: FastifyReply
) => {
  const { tenantId, profile, id } = request.user as any;
  if (profile !== "admin") {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
  const { apiId } = request.params as any;
  try {
    const newToken = await RenewApiConfigTokenService({
      apiId,
      userId: id,
      sessionId: request.body.sessionId,
      tenantId: tenantId,
    });
    return reply.code(STANDARD.OK.statusCode).send(newToken);
  } catch (error) {
    return handleServerError(reply, error);
  }
};
