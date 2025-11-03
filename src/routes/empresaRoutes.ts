import { FastifyInstance } from "fastify";
import * as EmpresaContatoController from "../controller/EmpresaContatoController";
import * as EmpresaController from "../controller/EmpresaController";

export default async function empresaRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.get("/", EmpresaController.listaEmpresas);

  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "identifier"],
          properties: {
            identifier: { type: "string", pattern: "^[0-9]{14}$" },
            name: { type: "string" },
            address: { type: "object" },
            conclusao: { type: "string" },
            acessoExterno: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
      },
    },
    EmpresaController.createEmpresa
  );
  fastify.delete("/:empresaId", EmpresaController.deleteEmpresa);
  fastify.put(
    "/:empresaId",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "identifier"],
          properties: {
            identifier: { type: "number" },
            name: { type: "string" },
            address: { type: "object" },
            conclusao: { type: "string" },
            acessoExterno: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
      },
    },
    EmpresaController.updateEmpresa
  );

  fastify.post(
    "/:empresaId/contrato",
    {
      schema: {
        body: {
          type: "object",
          required: ["totalHoras", "dataContrato"],
          properties: {
            totalHoras: { type: "string" },
            dataContrato: { type: "string" },
          },
        },
      },
    },
    EmpresaController.insertOrUpdateContrato
  );

  // Rotas empresa contato

  fastify.get("/:empresaId/contacts", EmpresaContatoController.ListContact);
  fastify.put(
    "/:empresaId/contacts",
    {
      schema: {
        body: {
          type: "object",
          required: ["contactIds"],
          properties: {
            contactIds: {
              type: "array",
              items: { type: "number" },
            },
          },
        },
      },
    },
    EmpresaContatoController.addContactsEmpresa
  );
  fastify.delete(
    "/:empresaId/contacts/:contactId",
    EmpresaContatoController.removeContatoEmpresa
  );
  fastify.delete(
    "/:empresaId/deleteall/contacts",
    EmpresaContatoController.removeAllContatoEmpresa
  );
  done();
}
