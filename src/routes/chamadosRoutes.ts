import { FastifyInstance } from "fastify";
import * as ChamadoController from "../controller/ChamadoController";

export default async function chamadoRoutes(fastify: FastifyInstance) {
  fastify.get("/chamados", ChamadoController.listaTodosChamados);
  fastify.get(
    "/chamados/:empresaId/time",
    ChamadoController.listaTempoChamados
  );
  fastify.put("/chamados/:chamadoId", ChamadoController.updateChamado);
}
