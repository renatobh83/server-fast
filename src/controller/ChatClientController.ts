import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";
import { FindEmpresaByIdentifierServices } from "../services/EmpresaServices/FindEmpresaByIdentifierServices";
import { sign } from "jsonwebtoken";
import { saveFile } from "../utils/saveFile";
import path from "node:path";
import { logger } from "../utils/logger";

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
    return reply.code(STANDARD.OK.statusCode).send({ token });
  } catch (error) {
    logger.error("Error in createTokenChatClient",error )
    return handleServerError(reply, error);
  }
};

export const storeFileChatClient = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const files = request.files();
    const publicFolder = path.join(process.cwd(), "public");
    let filename;
    for await (const file of files) {
      try {
        filename = await saveFile(file, publicFolder);
      } catch (error) {
        console.log(error);
      }
    }
    const fileUrl = `${process.env.BACKEND_URL}/public/${filename}`;

    return reply.code(STANDARD.OK.statusCode).send({ url: fileUrl });
  } catch (error) {
    logger.error("Error in storeFileChatClient",error )
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
    logger.error("Error in widgetChatClient",error )
    return handleServerError(reply, error);
  }
};
