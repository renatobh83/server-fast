import { FastifyInstance } from "fastify";
import * as ApiConfigController from "../controller/ApiConfigController";

export default async function apiConfiRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.post(
    "/",
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
  fastify.get("/", ApiConfigController.listApiConfig);
  fastify.put(
    "/:apiId",
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
  fastify.put("/renew-token/:apiId", ApiConfigController.RenewTokenApiConfig);
  fastify.delete("/:apiId", ApiConfigController.DeleteApiConfig);
  done();
}
