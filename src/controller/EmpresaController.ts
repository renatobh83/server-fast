import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import { ERRORS, handleServerError } from "../errors/errors.helper";
import { ListEmpresaService } from "../services/EmpresaServices/ListEmpresaService";
import { CreateEmpresaServices } from "../services/EmpresaServices/CreateEmpresaServices";
import { DeleteEmpresaService } from "../services/EmpresaServices/DeleteEmpresaService";
import { UpdateEmpresaServices } from "../services/EmpresaServices/UpdateEmpresaServices";
import { InserteOrUpdateContratoService } from "../services/EmpresaServices/InserteOrUpdateContratoService";

export const listaEmpresas = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  try {
    const empresas = await ListEmpresaService(tenantId);
    return reply.code(STANDARD.OK.statusCode).send(empresas);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const createEmpresa = async (
  request: FastifyRequest<{
    Body: {
      name: string;
      identifier: number;
      address: object;
      acessoExterno: string[];
    };
  }>,
  reply: FastifyReply
) => {
  const { tenantId, profile } = request.user as any;
  if (profile !== "admin") {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
  const { name, identifier, address, acessoExterno } = request.body;
  try {
    const empresa = await CreateEmpresaServices({
      identifier,
      name,
      tenantId,
      acessoExterno,
      address,
    });
    return reply.code(STANDARD.OK.statusCode).send(empresa);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const deleteEmpresa = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, profile } = request.user as any;
  if (profile !== "admin") {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
  const { empresaId } = request.params as any;
  try {
    if (
      await DeleteEmpresaService({
        empresaId,
        tenantId,
      })
    )
      return reply
        .code(STANDARD.OK.statusCode)
        .send({ message: "Empresa apagada." });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const updateEmpresa = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { profile } = request.user as any;
  if (profile !== "admin") {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
  const { empresaId } = request.params as any;
  const { name, address, active, identifier, acessoExterno } =
    request.body as any;
  try {
    const empresa = await UpdateEmpresaServices({
      empresaId: Number(empresaId),
      acessoExterno,
      active,
      name,
      address,
      identifier,
    });
    return reply.code(STANDARD.OK.statusCode).send(empresa);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const insertOrUpdateContrato = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { profile, tenantId } = request.user as any;
  if (profile !== "admin") {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
  const { empresaId } = request.params as any;
  const { totalHoras, dataContrato } = request.body as any;
  try {
    const dadosContrato = await InserteOrUpdateContratoService({
      dataContrato,
      empresaId,
      tenantId,
      totalHoras,
    });
    return reply.code(STANDARD.OK.statusCode).send(dadosContrato);
  } catch (error) {
    return handleServerError(reply, error);
  }
};
