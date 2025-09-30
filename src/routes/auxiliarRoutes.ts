import { FastifyInstance } from "fastify";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";
import { verify } from "jsonwebtoken";
import { redisClient } from "../lib/redis";
import { CadastroPaciente } from "../services/IntegracoesServices/Genesis/Helpers/CadastrarPaciente";
const usedTokens = new Set();

export default async function auxiliarRoutes(fastify: FastifyInstance) {
  fastify.post("/api/validate-registration-token", (request, reply) => {
    const { token } = request.body as any;
    try {
      verify(
        token,
        "78591a1f59eda6e939d7a7752412b364a5218eef12a839616af49080860273c7"
      );
      const tokenSignature = token.split(".")[2];
      if (usedTokens.has(tokenSignature)) {
        return reply
          .code(STANDARD.RESET_CONTENT.statusCode)
          .send("TOKEN_JA_UTILIZADO");
      }
      return reply.code(STANDARD.OK.statusCode).send({ valid: true });
    } catch (error) {
      return handleServerError(reply, error);
    }
  });

  fastify.get("/r/:code", async (request, reply) => {
    const { code } = request.params as any;
    try {
      const originalUrl = await redisClient.get(`short:${code}`);

      if (!originalUrl) {
        return reply
          .code(STANDARD.NO_CONTENT.statusCode)
          .send("Link expirado ou inválido");
      }
      return reply.redirect(originalUrl);
    } catch (error) {
      return handleServerError(reply, error);
    }
  });

  fastify.post("/api/complete-registration", async (request, reply) => {
    const { token } = request.body as any;
    try {
      const tokenSignature = token.split(".")[2];
      usedTokens.add(tokenSignature);

      return reply.code(STANDARD.OK.statusCode).send({ success: true });
    } catch (error) {
      return handleServerError(reply, error);
    }
  });
  fastify.post("/api/register", async (request, reply) => {
    const { token, formData } = request.body as any;
    try {
      const decode = verify(
        token,
        "78591a1f59eda6e939d7a7752412b364a5218eef12a839616af49080860273c7"
      );
      await CadastroPaciente({ token: decode, formdata: formData });
      return reply.code(STANDARD.OK.statusCode).send({ success: true });
    } catch (error) {
      return handleServerError(reply, error);
    }
  });

  fastify.get("/pdf/:cdPlano", async (request, reply) => {
    const { cdPlano } = request.params as any;
    const { token } = request.query as any;
    try {
      verify(
        token,
        "78591a1f59eda6e939d7a7752412b364a5218eef12a839616af49080860273c7"
      );
      const htmlContent = await redisClient.get(`Pdf:${cdPlano}`);
      if (!htmlContent) {
        return reply
          .status(STANDARD.NO_CONTENT.statusCode)
          .send("PDF expirado ou não encontrado");
      }

      return reply
        .header("Content-Type", "text/html; charset=utf-8")
        .code(200)
        .send(htmlContent);
    } catch (error) {
      return handleServerError(reply, error);
    }
  });
}
