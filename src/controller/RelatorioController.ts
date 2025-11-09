import { FastifyRequest, FastifyReply } from "fastify";
import { ChamadosByPeriodo } from "../services/RelatorioService/ChamadosByPeriodo";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";
import { generateAndDownloadPDF } from "../services/RelatorioService/generateAndDownloadPDFservice";
import { logger } from "../utils/logger";

export const relatorioChamado = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { startDate } = request.body as any;
  try {
    const data = await ChamadosByPeriodo(startDate);

    return reply.code(STANDARD.OK.statusCode).send(data);
  } catch (error) {
    logger.error("Error in relatorioChamado",error )
    return handleServerError(reply, error);
  }
};

export const reportGenerateByCompany = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { empresaId, period, now } = request.body as any;
  try {
    await generateAndDownloadPDF({ empresaId, period, dataReport: now }, reply);

    return reply.code(STANDARD.OK.statusCode);
  } catch (error) {
    logger.error("Error in reportGenerateByCompany",error )
    return handleServerError(reply, error);
  }
};
