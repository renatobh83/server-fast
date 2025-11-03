import { FastifyInstance } from "fastify";
import * as ApiExternaController from "../controller/ApiExternaController";

export default async function apiExternaRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.post(
    "/api/external/:apiId",
    { preHandler: [fastify.authenticate] },
    ApiExternaController.sendMenssageApi
  );

  fastify.post(
    "/api/external/:apiId/:idIntegracao/:authToken",
    { preHandler: [] },
    ApiExternaController.integracaoConfirmacao
  );
  done();
}
