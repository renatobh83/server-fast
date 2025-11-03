import { FastifyInstance } from "fastify/types/instance";
import * as NfeController from "../controller/NfeController";

export default async function notaFiscalRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.post(
    "/",
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
  fastify.get("/:empresaId", NfeController.consultaNotaFiscal);
  fastify.get("/nota/:rps", NfeController.gerarPdfRPS);
  fastify.post("/nota/:rps", NfeController.cancelarNfe);
  fastify.get("/pdf/status/:jobId", NfeController.verificarStatusPDF);
  fastify.get("/pdf/download/:jobId", NfeController.baixarPDF);
  done();
}
