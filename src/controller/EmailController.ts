import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import { AppError, handleServerError } from "../errors/errors.helper";
import { ListEmailService } from "../services/EmailServices/ListEmailService";
import { CreateEmailService } from "../services/EmailServices/CreateEmailService";
import { detailsChamadoService } from "../services/ChamadoServices/DetailsChamadoService";
import { sendEmailOpenClose } from "../services/EmailServices/SendEmailOpenClose";
import { SendEmailServices } from "../services/EmailServices/SendEmailServices";

export const listEmailConfiguracao = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  try {
    const email = await ListEmailService({ tenantId });
    return reply.code(STANDARD.OK.statusCode).send(email);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const createEmail = async (
  request: FastifyRequest<{
    Body: {
      email: string;
      senha: string;
      ssl: boolean;
      tsl: string;
      smtp: string;
      portaSMTP: number;
    };
  }>,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  const payload = { ...request.body, tenantId };
  try {
    const email = await CreateEmailService(payload);
    return reply.code(STANDARD.OK.statusCode).send(email);
  } catch (error) {
    return handleServerError(reply, error);
  }
};
export const sendEmailChamadoClose = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { chamadoId } = request.params as { chamadoId: number };
  const chamado = await detailsChamadoService(chamadoId);
  if (!chamado) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }
  try {
    await sendEmailOpenClose(chamado, chamado.conclusao);
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "E-mail enviado" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const sendEmailController = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  const { to, subject, html, attachmentUrl } = request.body as any;

  SendEmailServices({
    to,
    tenantId,
    subject,
    html,
    attachmentUrl,
  });
  try {
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "E-mail enviado" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const sendEmailControllerTest = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  const { html, text } = request.body as any;

  SendEmailServices({
    tenantId,
    to: "suporte2@exp.net.br",
    subject: "Teste envio de email",
    html,
    text,
  });
  try {
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "E-mail enviado" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};
