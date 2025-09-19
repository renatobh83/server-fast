import { FastifyInstance } from "fastify/types/instance";
import * as NfeController from "../controller/NfeController";

export default async function notaFiscalRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/nota-fiscal",
    {
      schema: {
        body: {
          type: "object",
          required: [
            "empresa",
            "descricao",
            "valorFloat",
            "dataEmissao",
            "impostosParaEnviar",
            "descontos",
          ],
          properties: {
            name: { type: "string" },
            descricao: { type: "string" },
            valorFloat: { type: "string" },
            dataEmissao: { type: "string" },
            impostosParaEnviar: { type: "object" },
            descontos: { type: "object" },
          },
        },
      },
    },
    NfeController.gerarNotaFiscal
  );
  fastify.get("/nota-fiscal/:empresaId", NfeController.consultaNotaFiscal);
  fastify.get("/nota-fiscal/nota/:rps", NfeController.gerarPdfRPS);
  fastify.post("/nota-fiscal/nota/:rps", NfeController.cancelarNfe);
  fastify.get(
    "/nota-fiscal/pdf/status/:jobId",
    NfeController.verificarStatusPDF
  );
  fastify.get("/nota-fiscal/pdf/download/:jobId", NfeController.baixarPDF);
}
