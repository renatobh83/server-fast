import { FastifyInstance } from "fastify/types/instance";
import * as IntegracaoController from "../controller/IntegracaoController";

export default async function integtracaoRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.get("/", IntegracaoController.listIntegracao);
  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "config_json"],
          properties: {
            name: { type: "string" },
            config_json: { type: "string" },
          },
        },
      },
    },
    IntegracaoController.createIntegracao
  );
  fastify.put(
    "/:id",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "config_json"],
          properties: {
            name: { type: "string" },
            config_json: { type: "string" },
          },
        },
      },
    },
    IntegracaoController.updateIntegracao
  );
  fastify.post(
    "/dados/:id",
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
  fastify.delete("/:integracaoId", IntegracaoController.deleteIntegracao);
  done();
}
