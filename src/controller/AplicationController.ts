import { FastifyRequest, FastifyReply } from "fastify";
import { LoadInitialAplicationService } from "../services/AplicationServices/LoadInitialAplicationService";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";
import { logger } from "../utils/logger";

export const loadInicial = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, profile, id } = request.user as any;
  try {
    const data = await LoadInitialAplicationService({
      tenantId,
      profile,
      userId: id,
    });

    return reply.code(STANDARD.OK.statusCode).send(data);
  } catch (error) {
    logger.error("Error in loadInicial",error )
    return handleServerError(reply, error);
  }
};
