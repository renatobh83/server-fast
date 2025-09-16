import { FastifyInstance } from "fastify";
import * as ChamadoController from "../controller/ChamadoController";

export default async function chamadoRoutes(fastify: FastifyInstance) {
  fastify.get("/chamados", ChamadoController.listaTodosChamados);
  fastify.get(
    "/chamados/:empresaId/time",
    ChamadoController.listaTempoChamados
  );
  fastify.put("/chamados/:chamadoId", {
    schema: {
      body: {
        type: "object",
        required: [ "contatoId"],
        properties: {
          ticketId: { type: "number" },
          descricao: { type: "string" },
          contatoId: { type: "number" },
          assunto: { type: "string" },
          conclusao: { type: "string" },
          comentarios: {
            type: "array",
            items: { type: "string" }},
          files: {
              type: "array",
              items: {}
            },
            status: { type: "string" },

          },
        },
              response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
              token: { type: "string" },
            },
          },
        },
      }
    }, ChamadoController.updateChamado);
  fastify.get("/chamados/:chamadoId", ChamadoController.detailsChamado);
}
