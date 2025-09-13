import { FastifyRequest, FastifyReply } from "fastify";
import { AppError, ERRORS, handleServerError } from "../errors/errors.helper";
import * as Yup from "yup";
import { isMatch } from "date-fns";
import { STANDARD } from "../constants/request";

export const updateBusinessHours = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, profile } = request.server.user;
  try {
    if (profile !== "admin") {
      return reply
        .code(ERRORS.unauthorizedAccess.statusCode)
        .send(ERRORS.unauthorizedAccess.message);
    }

    const businessHours = request.body;

    const schema = Yup.array().of(
      Yup.object().shape({
        day: Yup.number().required().integer(),
        label: Yup.string().required(),
        type: Yup.string().required(),
        hr1: Yup.string()
          .required()
          .test("isHoursValid", "${path} is not valid", (value) =>
            isMatch(value || "", "HH:mm")
          ),

        hr2: Yup.string()
          .required()
          .test("isHoursValid", "${path} is not valid", (value) =>
            isMatch(value || "", "HH:mm")
          ),
        hr3: Yup.string()
          .required()
          .test("isHoursValid", "${path} is not valid", (value) =>
            isMatch(value || "", "HH:mm")
          ),
        hr4: Yup.string()
          .required()
          .test("isHoursValid", "${path} is not valid", (value) =>
            isMatch(value || "", "HH:mm")
          ),
      })
    );

    try {
      await schema.validate(businessHours);
    } catch (error: any) {
      return reply
        .code(ERRORS.UnprocessableEntity.statusCode)
        .send(ERRORS.UnprocessableEntity.message);
    }

    // const newBusinessHours = await UpdateBusinessHoursService({
    //   businessHours,
    //   tenantId,
    // });

    reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "CONFIGURAR UPDATE" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const updateMessageBusinessHours = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, profile } = request.server.user;
  try {
    if (profile !== "admin") {
      return reply
        .code(ERRORS.unauthorizedAccess.statusCode)
        .send(ERRORS.unauthorizedAccess.message);
    }

    const { messageBusinessHours } = request.body as any;

    if (!messageBusinessHours) {
      throw new AppError("ERR_NO_MESSAGE_INFORMATION", 404);
    }

    // const newBusinessHours = await UpdateMessageBusinessHoursService({
    //   messageBusinessHours,
    //   tenantId,
    // });

    reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "CONFIGURAR UPDATE" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const showBusinessHoursAndMessage = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.server.user;
  try {
    // const tenant = await ShowBusinessHoursAndMessageService({ tenantId });

    reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "CONFIGURAR UPDATE" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const udpateDadosNf = async (
    request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.server.user;
  const { address, dadosNfe, razaoSocial } = request.body as any;
  try {
    // const tenant = await UpdateDadosTenantService({
    //   tenantId,
    //   address,
    //   dadosNfe,
    //   razaoSocial,
    // });

        reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "CONFIGURAR reply" });
  } catch (error) {
     return handleServerError(reply, error);
  }
};

export const listInfoTenant = async (
    request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.server.user;

  try {
    // const tenant = await ListDadosTenantService({ tenantId });

    
        reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "CONFIGURAR reply" });
  } catch (error) {
     return handleServerError(reply, error);
  }
};
