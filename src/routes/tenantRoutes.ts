import { FastifyInstance } from "fastify";
import * as TenantController from "../controller/TenantController";

export default async function tenantRoutes(fastify: FastifyInstance) {
  fastify.get("/business-hours", TenantController.showBusinessHoursAndMessage);
}
