import { FastifyInstance } from "fastify";
import * as ChamadoController from "../controller/ChamadoController";

export default async function chamadoRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/chamados",
    {
      schema: {
        body: {
          type: "object",
          required: ["contatoId", "empresaId", "descricao", "assunto"],
          properties: {
            ticketId: { type: "number" },
            descricao: { type: "string" },
            empresaId: { type: "string" },
            contatoId: {
              anyOf: [
                { type: "number" }, // permite um único número
                {
                  type: "array", // ou um array de números
                  items: { type: "number" },
                  minItems: 1,
                },
              ],
            },
            assunto: { type: "string" },
          },
        },
      },
    },
    ChamadoController.createChamado
  );
  fastify.get("/chamados", ChamadoController.listaTodosChamados);
  fastify.get(
    "/chamados/:empresaId/time",
    ChamadoController.listaTempoChamados
  );
  fastify.put(
    "/chamados/:chamadoId/anexo",
    ChamadoController.updateAnexoChamado
  );
  fastify.put(
    "/chamados/:chamadoId",
    {
      schema: {
        body: {
          type: "object",
          required: ["contatoId"],
          properties: {
            ticketId: { type: "number" },
            descricao: { type: "string" },
            contatoId: {
              anyOf: [
                { type: "string" }, // permite um único número
                {
                  type: "array", // ou um array de números
                  items: { type: "string" },
                  minItems: 1,
                },
              ],
            },
            assunto: { type: "string" },
            conclusao: { type: "string" },
            comentarios: {
              type: "array",
              items: {},
            },
            files: {
              type: "array",
              items: {},
            },
            status: { type: "string" },
          },
        },
      },
    },
    ChamadoController.updateChamado
  );
  fastify.get("/chamados/:chamadoId", ChamadoController.detailsChamado);
  fastify.get(
    "/chamados/empresa/:empresaId",
    ChamadoController.listaChamadosEmpresa
  );
  fastify.put(
    "/chamados/empresa/:empresaId",
    {
      schema: {
        body: {
          type: "object",
          required: ["ticketId", "chamadoId"],
          properties: {
            ticketId: { type: "number" },
            chamadoId: { type: "number" },
          },
        },
      },
    },
    ChamadoController.associarTicketChamado
  );
  fastify.put(
    "/chamados/:ticketId/tempoChamado",
    {
      schema: {
        body: {
          type: "object",
          required: ["tempoAjusteMinutos", "motivo"],
          properties: {
            tempoAjusteMinutos: { type: "number" },
            motivo: { type: "string" },
          },
        },
      },
    },
    ChamadoController.editarTempoChamado
  );
  fastify.get("/chamado/media/:id/arquivo", ChamadoController.getMediaChamado);
  fastify.delete("/chamados/media/:id", ChamadoController.removeMediaChamado);
  fastify.post("/chamados/media/", ChamadoController.updateFileChamado);
  fastify.post(
    "/chamado/:chamadoId/sendMessage",
    ChamadoController.sendMessageChamado
  );
}
