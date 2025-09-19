import { FastifyInstance } from "fastify/types/instance";
import * as RelatorioController from "../controller/RelatorioController";

export default async function statisticsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/relatorio-chamado",
    {
      schema: {
        body: {
          type: "object",
          required: ["startDate"],
          properties: {
            startDate: { type: "string" },
          },
        },
      },
    },
    RelatorioController.relatorioChamado
  );
  fastify.post(
    "/generate-Report",
    {
      schema: {
        body: {
          type: "object",
          required: ["empresaId", "period", "now"],
          properties: {
            startDate: { type: "string" },
            period: { type: "string" },
            now: { type: "string" },
          },
        },
      },
    },
    RelatorioController.reportGenerateByCompany
  );
}
