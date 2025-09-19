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
import {
  CreateChamadoService,
  dataChamado,
} from "../services/ChamadoServices/CreateChamadoService";
import { associarTicketChamadoService } from "../services/ChamadoServices/associarTicketChamadoService";
import { EditarTempoChamadoService } from "../services/ChamadoServices/EditarTempoChamadoService";
import { GetMediaChamadoService } from "../services/ChamadoServices/getMediaChamadoServices";
import { RemoveMidaChamadoService } from "../services/ChamadoServices/RemoveMediaChamadoService";
import { SendMessageChamadoServices } from "../services/ChamadoServices/SendMessageChamadoServices";
import { UpdateMediaDadosService } from "../services/ChamadoServices/UpdateMediaDadosService";
import { updateChamadoMediaServices } from "../services/ChamadoServices/updateChamadoMediaServices";

const ATTACHMENTSFOLDER = path.join(__dirname, "public/attachments");
// Garantir que a pasta existe
if (!fs.existsSync(ATTACHMENTSFOLDER)) {
  fs.mkdirSync(ATTACHMENTSFOLDER, { recursive: true });
}

type IListallRequest = {
  pageNumber: string;
};

export const createChamado = async (
  request: FastifyRequest<{ Body: dataChamado }>,
  reply: FastifyReply
) => {
  const { id, tenantId } = request.user as any;

  try {
    const chamado = await CreateChamadoService({
      data: request.body,
      tenantId,
      userId: id,
    });
    return reply.code(STANDARD.OK.statusCode).send(chamado);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
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
    const chamado = await updateChamadoService(payload);
    return reply.code(STANDARD.OK.statusCode).send(chamado.toJSON());
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const updateAnexoChamado = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const files = request.files();
  const { chamadoId } = request.params as any;
  try {
    const uploadedFiles: { filename: string; path: string }[] = [];
    for await (const file of files) {
      const filename = await saveFile(file, ATTACHMENTSFOLDER);
      uploadedFiles.push({ filename, path: `/attachments/${filename}` });
    }
    const saved = await updateChamadoMediaServices(uploadedFiles, chamadoId);

    return reply.code(STANDARD.OK.statusCode).send(saved);
  } catch (error) {
    return handleServerError(reply, error);
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
    return handleServerError(reply, error);
  }
};

export const associarTicketChamado = async (
  request: FastifyRequest<{ Body: { ticketId: number; chamadoId: number } }>,
  reply: FastifyReply
) => {
  const { empresaId } = request.params as { empresaId: number };
  const { ticketId, chamadoId } = request.body;
  try {
    const Chamado = await associarTicketChamadoService({
      empresaId,
      ticketId,
      chamadoId,
    });
    return reply.code(STANDARD.OK.statusCode).send(Chamado);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const editarTempoChamado = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { ticketId } = request.params as { ticketId: number };
  const { tempoAjusteMinutos, motivo } = request.body as any;
  if (await EditarTempoChamadoService({ ticketId, tempoAjusteMinutos, motivo }))
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "Tempo chamado ajustado" });
  try {
  } catch (error) {
    return handleServerError(reply, error);
  }
};
export const getMediaChamado = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: number };
    const data = await GetMediaChamadoService(id);

    return reply.code(STANDARD.OK.statusCode).send(data);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const removeMediaChamado = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params as { id: number };
    await RemoveMidaChamadoService(id);
    return reply.code(STANDARD.OK.statusCode).send({ message: "Sucess" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const sendMessageChamado = async (
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) => {
  try {
    const { tenantId } = request.user as any;
    const dataBody = request.body as any;
    const payload = { ...dataBody, tenantId };
    await SendMessageChamadoServices(payload);
    return reply.code(STANDARD.OK.statusCode).send({ message: "Sucess" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const updateFileChamado = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const dataBody = request.body as any;

    await UpdateMediaDadosService(dataBody);
    return reply.code(STANDARD.OK.statusCode).send({ message: "Sucess" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};
