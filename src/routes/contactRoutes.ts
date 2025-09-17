import { FastifyInstance } from "fastify";
import * as ContactController from "../controller/ContactController";

export default async function contactRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/contacts",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "number"],
          properties: {
            number: { type: "number" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            dtaniversario: { type: "string" },
            identifier: { type: "string" },
            telegramId: { type: "number" },
            isGroup: { type: "boolean" },
            empresas: { type: "string" },
            profilePicUrl: { type: "string" },
            isWAContact: { type: "boolean" },
            serializednumber: { type: "string" },
            id: { type: "object", items: { type: "number" } },
          },
        },
      },
    },
    ContactController.store
  );
  fastify.get("/contacts", ContactController.listaContatos);
  fastify.put(
    "/contacts/:contactId",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "number"],
          properties: {
            number: { type: "number" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            dtaniversario: { type: "string" },
            identifier: { type: "string" },
            telegramId: { type: "number" },
            isGroup: { type: "boolean" },
            empresas: { type: "string" },
            profilePicUrl: { type: "string" },
            isWAContact: { type: "boolean" },
            serializednumber: { type: "string" },
          },
        },
      },
    },
    ContactController.updateContato
  );
  fastify.get("/contacts/:contactId", ContactController.detalhesContato);
  //   fastify.put("/users/:userId", AdminController.updateUser);
}
