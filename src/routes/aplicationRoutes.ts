import { FastifyInstance } from "fastify";
import * as AplicationController from "../controller/AplicationController";
export default async function aplicationRoutes(fastify: FastifyInstance) {
  fastify.get("/loadInicial", AplicationController.loadInicial);
}
