import { FastifyInstance } from "fastify";
import * as ApiConfigController from "../controller/ApiConfigController";

export default async function apiConfiRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/api-config",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "sessionId"],
          properties: {
            name: { type: "string" },
            authToken: { type: "string" },
            urlServiceStatus: { type: "string" },
            urlMessageStatus: { type: "string" },
            sessionId: { type: "number" },
            isActive: { type: "boolean" },
          },
        },
      },
    },
    ApiConfigController.createApiConfig
  );
  fastify.get("/api-config", ApiConfigController.listApiConfig);
  fastify.put(
    "/api-config/:apiId",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "sessionId"],
          properties: {
            name: { type: "string" },
            authToken: { type: "string" },
            urlServiceStatus: { type: "string" },
            urlMessageStatus: { type: "string" },
            sessionId: { type: "number" },
            isActive: { type: "boolean" },
          },
        },
      },
    },
    ApiConfigController.listApiConfig
  );
  fastify.put(
    "/api-config/renew-token/:apiId",
    ApiConfigController.RenewTokenApiConfig
  );
  fastify.delete("/api-config/:apiId", ApiConfigController.DeleteApiConfig);
}
