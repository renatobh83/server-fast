import { FastifyInstance } from "fastify";
import * as TenantController from "../controller/TenantController";
import { checkValidRequest, checkValidUser } from "../middleware/auth.helper";

export default async function tenantRoutes(fastify: FastifyInstance) {
  fastify.get("/business-hours", TenantController.showBusinessHoursAndMessage);
}
