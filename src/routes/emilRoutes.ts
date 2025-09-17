import { FastifyInstance } from "fastify";
import * as EmailController from "../controller/EmailController";

export default async function emailRoutes(fastify: FastifyInstance) {
  fastify.get("/email", EmailController.listEmailConfiguracao);
  fastify.post(
    "/email",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "senha", "ssl", "tsl", "smtp", "portaSMTP"],
          properties: {
            portaSMTP: { type: "number" },
            senha: { type: "string" },
            email: { type: "string", format: "email" },
            tsl: { type: "string" },
            ssl: { type: "boolean" },
            smtp: { type: "string" },
          },
        },
      },
    },
    EmailController.createEmail
  );
}
