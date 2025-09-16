import { FastifyRequest, FastifyReply } from "fastify";
import { ListaTodosChamadosService } from "../services/ChamadoServices/ListChamadoService";
import { handleServerError } from "../errors/errors.helper";
import { STANDARD } from "../constants/request";
import { ListTempoChamado } from "../services/ChamadoServices/ListTempoChamadoService";
import fs from "node:fs";
import path from "node:path";
import { saveFile } from "../utils/saveFile";
import { updateChamadoService } from "../services/ChamadoServices/UpdateChamadoService";
import { detailsChamadoService } from "../services/ChamadoServices/DetailsChamadoService";

const ATTACHMENTSFOLDER = path.join(__dirname, "public/attachments");
// Garantir que a pasta existe
if (!fs.existsSync(ATTACHMENTSFOLDER)) {
  fs.mkdirSync(ATTACHMENTSFOLDER, { recursive: true });
}

type IListallRequest = {
  pageNumber: string;
};

export const listaTodosChamados = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { pageNumber } = request.query as IListallRequest;
  try {
    const { chamados, count, hasMore } = await ListaTodosChamadosService({
      pageNumber,
    });

    return reply.code(STANDARD.OK.statusCode).send({
      chamados,
      count,
      hasMore,
    });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const listaTempoChamados = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { empresaId } = request.params as { empresaId: number };
  try {
    const tempoChamado = await ListTempoChamado(empresaId);
    return reply.code(STANDARD.OK.statusCode).send(tempoChamado);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const updateChamado = async (
  request: FastifyRequest<{
    Body: {
      ticketId: number;
      status: "ABERTO" | "EM_ANDAMENTO" | "CONCLUIDO" | "PAUSADO";
      userId: number;
      descricao: string;
      assunto: string;
      conclusao: string;
      comentarios: string[];
      contatoId: number;
    };
  }>,
  reply: FastifyReply
) => {
  const { tenantId, id } = request.user as any;
  const { chamadoId } = request.params as { chamadoId: number };

  const payload = {
    ...request.body,
    chamadoId,
    tenantId,
    userIdUpdate: id,
    socket: request.server.io,
  };
  try {
    const updatedChamado = await updateChamadoService(payload);
    return reply.code(STANDARD.OK.statusCode).send(updatedChamado);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const updateAnexoChamado = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const files = request.files();
  const uploadedFiles: { filename: string; path: string }[] = [];
  for await (const file of files) {
    const filename = await saveFile(file, ATTACHMENTSFOLDER);
    uploadedFiles.push({ filename, path: `/attachments/${filename}` });
  }
};

export const detailsChamado = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { chamadoId } = request.params as { chamadoId: number };
  try {
    const detalhesChamado = await detailsChamadoService(chamadoId);
    return reply.code(STANDARD.OK.statusCode).send(detalhesChamado);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
