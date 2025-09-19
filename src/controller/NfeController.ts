import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";
import { GerarNotaFiscalService } from "../services/NotaFiscalServices/GerarNotaFiscalService";
import { ConsultarNotaFiscalService } from "../services/NotaFiscalServices/ConsultarNotaFiscalService";
import { QueueNotaFiscalService } from "../services/NotaFiscalServices/QueueNotaFiscalSerive";
import { CancelarNotaFiscalService } from "../services/NotaFiscalServices/CancelarNotaFiscalService";
import { getJobById } from "../lib/Queue";
import { redisClient } from "../lib/redis";

export const gerarNotaFiscal = async (
  request: FastifyRequest<{
    Body: {
      empresa: string;
      descricao: string;
      valorFloat: string;
      dataEmissao: string;
      impostosParaEnviar: object;
      descontos: object;
    };
  }>,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;

  try {
    await GerarNotaFiscalService({ data: request.body, tenantId, reply });
    return reply.code(STANDARD.OK.statusCode).send();
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const consultaNotaFiscal = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { empresaId, numeroNota } = request.params as any;

  try {
    const notafiscal = await ConsultarNotaFiscalService({
      empresaId,
      numeroNota,
    });
    return reply.code(STANDARD.OK.statusCode).send(notafiscal);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const gerarPdfRPS = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { rps } = request.params as any;

  try {
    await QueueNotaFiscalService(rps, reply);
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "Inicio geracao PDF" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const cancelarNfe = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  const { rps } = request.params as any;

  try {
    const nfeCancelada = await CancelarNotaFiscalService({ tenantId, rps });
    return reply.code(STANDARD.OK.statusCode).send(nfeCancelada);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const verificarStatusPDF = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { jobId } = request.params as any;

  try {
    const job = await getJobById("pdfQueue", jobId);

    if (!job) {
      return reply.status(404).send({ error: "Job não encontrado" });
    }

    const state = await job.getState();

    switch (state) {
      case "completed":
        return reply.send({
          status: "completed",
          jobId: jobId,
        });
        break;

      case "failed":
        return reply.status(501).send({
          status: "failed",
          jobId: jobId,
          error: job.failedReason,
        });
        break;

      default:
        reply.send({
          status: state,
          jobId: jobId,
          message: "Em processamento",
        });
    }
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const baixarPDF = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { jobId } = request.params as any;
  const redisKey = `job_result:${jobId}`;

  try {
    const resultString = await redisClient.get(redisKey);
    if (!resultString) {
      return reply
        .code(STANDARD.NO_CONTENT.statusCode)
        .send(STANDARD.NO_CONTENT.message);
    }
    return reply.code(STANDARD.OK.statusCode).send(resultString);
  } catch (error) {
    return handleServerError(reply, error);
  }
};
