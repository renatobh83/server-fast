import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import ListSettingsService from "../services/SettingServices/ListSettingsService";
import { AppError, handleServerError } from "../errors/errors.helper";
import UpdateSettingService from "../services/SettingServices/UpdateSettingService";

export const listSettings = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  try {
    const settigns = await ListSettingsService(tenantId);
    return reply.code(STANDARD.OK.statusCode).send(settigns);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const updateSettings = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, profile } = request.user as any;
  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const { value, key } = request.body as any;
  try {
    const settign = await UpdateSettingService({
      key,
      tenantId,
      value,
    });
    return reply.code(STANDARD.OK.statusCode).send(settign);
  } catch (error) {
    return handleServerError(reply, error);
  }
};
