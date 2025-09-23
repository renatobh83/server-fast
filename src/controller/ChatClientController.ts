import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";
import { FindEmpresaByIdentifierServices } from "../services/EmpresaServices/FindEmpresaByIdentifierServices";
import { sign } from "jsonwebtoken";

export const createTokenChatClient = async (
  request: FastifyRequest<{
    Body: {
      name: string;
      email: string;
      identifier: number;
    };
  }>,
  reply: FastifyReply
) => {
  const { email, identifier, name } = request.body;
  const empresa = await FindEmpresaByIdentifierServices(identifier);
  const JWT_SECRET = process.env.CHAT_SECRET!;
  const payload = {
    name,
    email,
    tenantId: empresa.tenantId,
    empresaId: empresa.id,
    empresa: empresa.name,
    role: "guest", // se quiser diferenciar
    type: "chat-client", // útil para diferenciar tokens de painel
  };
  const token = sign(payload, JWT_SECRET, {
    expiresIn: "120m", // tempo de vida do token
  });

  try {
    return reply.code(STANDARD.OK.statusCode).send(token);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const storeFileChatClient = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const parts = request.parts();
    console.log(parts);
    return reply.code(STANDARD.OK.statusCode).send("token");
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const widgetChatClient = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    return reply
      .type("application/javascript")
      .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      .sendFile("chat-widget-core.js"); // relativo ao `root`
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
