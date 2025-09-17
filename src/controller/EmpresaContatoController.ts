import { FastifyRequest, FastifyReply } from "fastify";
import { ListContactEmpresaService } from "../services/EmpresaContatoServices/ListContactEmpresaService";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";
import { associateContactsEmpresaService } from "../services/EmpresaContatoServices/AssociateContactsEmpresaService";
import { DeleteContatoEmpresaService } from "../services/EmpresaContatoServices/DeleteContatoEmpresaService";
import { DeleteAllEmpresaContactsService } from "../services/EmpresaContatoServices/DeleteAllEmpresaContactsService";

//  Empresa Contatos Routes
export const addContactsEmpresa = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { empresaId } = request.params as any;
  const { contactIds } = request.body as any;
  try {
    const contatos = await associateContactsEmpresaService(
      empresaId,
      contactIds
    );
    return reply.code(STANDARD.OK.statusCode).send(contatos);
  } catch (error) {
    return handleServerError(reply, error);
  }
};
export const ListContact = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { empresaId } = request.params as { empresaId: number };

    const contacts = await ListContactEmpresaService(empresaId);
    return reply.code(STANDARD.OK.statusCode).send(contacts);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const removeContatoEmpresa = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { empresaId, contactId } = request.params as {
    empresaId: number;
    contactId: number;
  };
  try {
    if (await DeleteContatoEmpresaService({ empresaId, contactId }))
      return reply
        .code(STANDARD.OK.statusCode)
        .send({ message: "Contato excluido" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const removeAllContatoEmpresa = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { empresaId } = request.params as { empresaId: number };
  try {
    if (await DeleteAllEmpresaContactsService({ empresaId }))
      return reply
        .code(STANDARD.OK.statusCode)
        .send({ message: "Contatos excluido" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};
