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
  fastify.post(
    "/email/send",
    {
      schema: {
        body: {
          type: "object",
          required: ["to", "subject", "html"],
          // properties: {
          //   html: { type: "object" },
          //   subject: { type: "string" },
          //   to: { type: "string", format: "email" },
          //   attachmentUrl: { type: "string" },
          // },
        },
      },
    },
    EmailController.sendEmailController
  );
  fastify.post(
    "/email/send/teste",
    {
      schema: {
        body: {
          type: "object",
          required: ["text", "html"],
          properties: {
            html: { type: "object" },
            text: { type: "string" },
          },
        },
      },
    },
    EmailController.sendEmailController
  );
  fastify.post(
    "/email/send/:chamadoId/close",
    EmailController.sendEmailChamadoClose
  );
  fastify.post("/email/send/test", EmailController.sendEmailControllerTest);
}
