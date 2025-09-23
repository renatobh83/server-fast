import { FastifyInstance } from "fastify";
import * as ContactController from "../controller/ContactController";

export default async function contactRoutes(fastify: FastifyInstance) {
  fastify.get("/contacts", ContactController.listaContatos);
  fastify.get("/contacts/:contactId", ContactController.detalhesContato);

  fastify.post(
    "/contacts",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "number"],
          properties: {
            number: { type: "string" },
            name: { type: "string" },
            email: {
              anyOf: [
                { type: "string", format: "email" },
                { type: "string", maxLength: 0 }, // permite vazio
              ],
            },
            dtaniversario: { type: "string" },
            identifier: { type: "string" },
            telegramId: { type: "number" },
            isGroup: { type: "boolean" },
            profilePicUrl: { type: "string" },
            isWAContact: { type: "boolean" },
            serializednumber: { type: "string" },
            id: {
              anyOf: [
                { type: "object", items: { type: "number" } },
                { type: "string" }, // permite vazio
              ],
            },
          },
        },
      },
    },
    ContactController.store
  );
  fastify.put(
    "/contacts/:contactId",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "number"],
          properties: {
            number: { type: "string" },
            name: { type: "string" },
            email: {
              anyOf: [
                { type: "string", format: "email" },
                { type: "string", maxLength: 0 }, // permite vazio
              ],
            },
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
  fastify.put(
    "/contacts/:contactId/socket",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "number"],
          properties: {
            number: { type: "string" },
            name: { type: "string" },
            email: {
              anyOf: [
                { type: "string", format: "email" },
                { type: "string", maxLength: 0 }, // permite vazio
              ],
            },
            dtaniversario: { type: "string" },
            identifier: { type: "string" },
            telegramId: { type: "number" },
            isGroup: { type: "boolean" },
            empresas: { type: "string" },
            profilePicUrl: { type: "string" },
            isWAContact: { type: "boolean" },
            serializednumber: { type: "string" },
            id: {
              anyOf: [
                { type: "object", items: { type: "number" } },
                { type: "string" }, // permite vazio
              ],
            },
          },
        },
      },
    },
    ContactController.updateContatoSocket
  );
  //   fastify.put("/users/:userId", AdminController.updateUser);
}
