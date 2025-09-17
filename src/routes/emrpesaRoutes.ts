import { FastifyInstance } from "fastify";
import * as EmpresaContatoController from "../controller/EmpresaContatoController";
import * as EmpresaController from "../controller/EmpresaController";

export default async function empresaRoutes(fastify: FastifyInstance) {
  fastify.get("/empresas", EmpresaController.listaEmpresas);

  fastify.post(
    "/empresas",
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
              items: { type: "string" },
            },
          },
        },
      },
    },
    EmpresaController.createEmpresa
  );
  fastify.delete("/empresas/:empresaId", EmpresaController.deleteEmpresa);
  fastify.put(
    "/empresas/:empresaId",
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
              items: { type: "string" },
            },
          },
        },
      },
    },
    EmpresaController.updateEmpresa
  );

  fastify.post(
    "/empresas/:empresaId/contrato",
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

  fastify.get(
    "/empresas/:empresaId/contacts",
    EmpresaContatoController.ListContact
  );
  fastify.put(
    "/empresas/:empresaId/contacts",
    {
      schema: {
        body: {
          type: "object",
          required: ["contactIds"],
          properties: {
            contactIds: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
    EmpresaContatoController.addContactsEmpresa
  );
  fastify.delete(
    "/empresas/:empresaId/contacts/:contactId",
    EmpresaContatoController.removeContatoEmpresa
  );
  fastify.delete(
    "/empresas/:empresaId/deleteall/contacts",
    EmpresaContatoController.removeAllContatoEmpresa
  );
}
