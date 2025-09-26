import { FastifyInstance } from "fastify";
import * as ApiExternaController from "../controller/ApiExternaController";

export default async function apiExternaRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/:apiId",
    { preHandler: [fastify.authenticate] },
    ApiExternaController.sendMenssageApi
  );
  fastify.post(
    "/:apiId/:idIntegracao/:authToken",
    { preHandler: [] },
    ApiExternaController.integracaoConfirmacao
  );
}
