import { FastifyInstance } from "fastify/types/instance";
import * as IntegracaoController from "../controller/IntegracaoController";

export default async function integtracaoRoutes(fastify: FastifyInstance) {
  fastify.get("/integracoes", IntegracaoController.listIntegracao);
  fastify.post(
    "/integracoes",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "configJson"],
          properties: {
            name: { type: "string" },
            configJson: { type: "string" },
          },
        },
      },
    },
    IntegracaoController.createIntegracao
  );
  fastify.put(
    "/integracoes/:id",
    {
      schema: {
        body: {
          type: "object",
          required: [" name", "configJson"],
          properties: {
            name: { type: "string" },
            configJson: { type: "object" },
          },
        },
      },
    },
    IntegracaoController.updateIntegracao
  );
  fastify.post(
    "/integracoes/dados/:id",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "configJson", "id"],
          properties: {
            name: { type: "string" },
            configJson: { type: "object" },
            id: { type: "object" },
          },
        },
      },
    },
    IntegracaoController.createOrUpdateDadosIntegracao
  );
  fastify.delete(
    "/integracoes/:integracaoId",
    IntegracaoController.deleteIntegracao
  );
}
