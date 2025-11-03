import { FastifyInstance } from "fastify";
import * as AplicationController from "../controller/AplicationController";
export default async function aplicationRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.get("/", AplicationController.loadInicial);
  done();
}
