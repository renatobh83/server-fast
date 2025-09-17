import { FastifyInstance } from "fastify";
import * as EmpresaContatoController from "../controller/EmpresaContatoController";

export default async function empresaRoutes(fastify: FastifyInstance) {
  // Rotas empresa contato

  fastify.get(
    "/empresas/:empresaId/contacts",
    EmpresaContatoController.ListContact
  );
  fastify.put(
    "/empresas/:empresaId/contacts",
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
