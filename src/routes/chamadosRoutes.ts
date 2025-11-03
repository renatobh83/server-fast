import { FastifyInstance } from "fastify";
import * as ChamadoController from "../controller/ChamadoController";

export default async function chamadoRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.post(
    "/",
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
  fastify.get("/", ChamadoController.listaTodosChamados);
  fastify.get("/:empresaId/time", ChamadoController.listaTempoChamados);
  fastify.put("/:chamadoId/anexo", ChamadoController.updateAnexoChamado);
  fastify.put(
    "/:chamadoId",
    {
      schema: {
        body: {
          type: "object",
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
  fastify.get("/:chamadoId", ChamadoController.detailsChamado);
  fastify.get("/empresa/:empresaId", ChamadoController.listaChamadosEmpresa);
  fastify.put(
    "/empresa/:empresaId",
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
    "/:ticketId/tempoChamado",
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
  fastify.get("/media/:id/arquivo", ChamadoController.getMediaChamado);
  fastify.delete("/media/:id", ChamadoController.removeMediaChamado);
  fastify.post("/media/", ChamadoController.updateFileChamado);
  fastify.post("/:chamadoId/sendMessage", ChamadoController.sendMessageChamado);
  done();
}
