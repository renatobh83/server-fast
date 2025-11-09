import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import { AppError, handleServerError } from "../errors/errors.helper";
import CreateFastReplyService from "../services/FastReplyServices/CreateFastReplyService";
import ListFastReplyService from "../services/FastReplyServices/ListFastReplyService";
import UpdateFastReplyService from "../services/FastReplyServices/UpdateFastReplyService";
import DeleteFastReplyService from "../services/FastReplyServices/DeleteFastReplyService";
import { logger } from "../utils/logger";

interface FastReplyData {
  key: string;
  message: string;
  userId: number;
  tenantId: number;
}
export const createFastReply = async (
  request: FastifyRequest<{ Body: FastReplyData }>,
  reply: FastifyReply
) => {
  const { tenantId, profile, id } = request.user as any;
  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const newReply: FastReplyData = {
    ...request.body,
    userId: id,
    tenantId,
  };
  try {
    const respostaRapida = await CreateFastReplyService(newReply);
    return reply.code(STANDARD.OK.statusCode).send(respostaRapida);
  } catch (error) {
    logger.error("Error in createFastReply",error )
    return handleServerError(reply, error);
  }
};

export const listaFastReply = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  try {
    const respostaRapida = await ListFastReplyService({ tenantId });
    return reply.code(STANDARD.OK.statusCode).send(respostaRapida);
  } catch (error) {
     logger.error("Error in listaFastReply",error )
    return handleServerError(reply, error);
  }
};

export const updateFastReply = async (
  request: FastifyRequest<{ Body: FastReplyData }>,
  reply: FastifyReply
) => {
  const { tenantId, profile, id } = request.user as any;
  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  try {
    const fastReplyData: FastReplyData = {
      ...request.body,
      userId: id,
      tenantId,
    };

    const { fastReplyId } = request.params as { fastReplyId: string };
    const respostaRapida = await UpdateFastReplyService({
      fastReplyData,
      fastReplyId,
    });
    return reply.code(STANDARD.OK.statusCode).send(respostaRapida);
  } catch (error) {
    logger.error("Error in updateFastReply",error )
    return handleServerError(reply, error);
  }
};
export const deleteFastReply = async (
  request: FastifyRequest<{ Body: FastReplyData }>,
  reply: FastifyReply
) => {
  const { tenantId, profile } = request.user as any;
  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  try {
    const { fastReplyId } = request.params as { fastReplyId: string };
    if (
      await DeleteFastReplyService({
        tenantId,
        id: fastReplyId,
      })
    )
      return reply
        .code(STANDARD.OK.statusCode)
        .send({ message: "Resposta rapida apagada." });
  } catch (error) {
    logger.error("Error in deleteFastReply",error )
    return handleServerError(reply, error);
  }
};
