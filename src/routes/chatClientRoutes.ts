import { FastifyInstance } from "fastify";
import { verify } from "jsonwebtoken";
import * as ChatClientController from "../controller/ChatClientController";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";
import { CadastroPaciente } from "../services/IntegracoesServices/Genesis/Helpers/CadastrarPaciente";
const usedTokens = new Set();

export default async function chatRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.post(
    "/chatClient/token",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "email", "identifier"],
          properties: {
            name: { type: "string" },
            identifier: { type: "number" },
            email: { type: "string", format: "email" },
          },
        },
      },
    },
    ChatClientController.createTokenChatClient
  );
  fastify.post("/chatClient/upload", ChatClientController.storeFileChatClient);
  fastify.get("/chat-widget.js", ChatClientController.widgetChatClient);
  fastify.post("/validate-registration-token", (request, reply) => {
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

  fastify.post("/complete-registration", async (request, reply) => {
    const { token } = request.body as any;
    try {
      const tokenSignature = token.split(".")[2];
      usedTokens.add(tokenSignature);

      return reply.code(STANDARD.OK.statusCode).send({ success: true });
    } catch (error) {
      return handleServerError(reply, error);
    }
  });
  fastify.post("/register", async (request, reply) => {
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
  done();
}
