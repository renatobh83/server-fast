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
          required: ["name", "config_json"],
          properties: {
            name: { type: "string" },
            config_json: { type: "object" },
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
          required: [" name", "config_json"],
          properties: {
            name: { type: "string" },
            config_json: { type: "object" },
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
          required: ["name", "config_json", "id"],
          properties: {
            name: { type: "string" },
            config_json: { type: "object" },
            id: { type: "number" },
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
