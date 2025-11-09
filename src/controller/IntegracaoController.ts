import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import { ERRORS, handleServerError } from "../errors/errors.helper";
import CreateIntegracoesService from "../services/IntegracoesServices/CreateIntegracoesService";
import ListIntegracoesService from "../services/IntegracoesServices/ListIntegracoesServices";
import UpdateIntegracoesServices from "../services/IntegracoesServices/UpdateIntegracoesServices";
import CreateOrUpdateDadosIntegracaoService from "../services/IntegracoesServices/CreateOrUpdateDadosIntegracaoService";
import DeleteIntegracaoService from "../services/IntegracoesServices/DeleteIntegracaoServices";
import { logger } from "../utils/logger";

export const createIntegracao = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  const { name, config_json } = request.body as any;

  try {
    const integracao = await CreateIntegracoesService({
      name,
      config_json,
      tenantId,
    });
    return reply.code(STANDARD.OK.statusCode).send(integracao);
  } catch (error) {
    logger.error("Error in createIntegracao",error )
    return handleServerError(reply, error);
  }
};

export const listIntegracao = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;

  try {
    const integracoes = await ListIntegracoesService({ tenantId });
    return reply.code(STANDARD.OK.statusCode).send(integracoes);
  } catch (error) {
    logger.error("Error in listIntegracao",error )
    return handleServerError(reply, error);
  }
};

export const updateIntegracao = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as any;
  const { name, config_json } = request.body as any;
  try {
    const integracao = await UpdateIntegracoesServices({
      id,
      config_json,
      name,
    });
    return reply.code(STANDARD.OK.statusCode).send(integracao);
  } catch (error) {
    logger.error("Error in updateIntegracao",error )
    return handleServerError(reply, error);
  }
};

export const createOrUpdateDadosIntegracao = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { name, config_json, id } = request.body as any;
  try {
    const integracao = await CreateOrUpdateDadosIntegracaoService({
      id,
      valores_json: config_json,
      name,
    });

    return reply.code(STANDARD.OK.statusCode).send(integracao);
  } catch (error) {
    logger.error("Error in createOrUpdateDadosIntegracao",error )
    return handleServerError(reply, error);
  }
};
export const deleteIntegracao = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { profile } = request.user as any;
  if (profile !== "admin") {
    return reply
      .code(ERRORS.unauthorizedAccess.statusCode)
      .send(ERRORS.unauthorizedAccess.message);
  }
  const { integracaoId } = request.params as any;

  try {
    await DeleteIntegracaoService({ id: integracaoId });
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "Integracao Apagada." });
  } catch (error) {
    logger.error("Error in deleteIntegracao",error )
    return handleServerError(reply, error);
  }
};
