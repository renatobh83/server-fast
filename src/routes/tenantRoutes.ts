import { FastifyInstance } from "fastify";
import * as TenantController from "../controller/TenantController";

export default async function tenantRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.get("/", TenantController.listInfoTenant);
  fastify.post(
    "/nf-dados",
    {
      schema: {
        body: {
          type: "object",
          required: ["address", "dadosNfe", "razaoSocial"],
          properties: {
            address: { type: "object" },
            dadosNfe: { type: "object" },
            razaoSocial: { type: "string" },
          },
        },
      },
    },
    TenantController.udpateDadosNf
  );
  fastify.put("/business-hours", TenantController.updateBusinessHours);
  fastify.put(
    "/message-business-hours",
    TenantController.updateMessageBusinessHours
  );
  fastify.get("/business-hours", TenantController.showBusinessHoursAndMessage);
  done();
}
