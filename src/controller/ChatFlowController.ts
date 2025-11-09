import { FastifyRequest, FastifyReply } from "fastify";
import { AppError, handleServerError } from "../errors/errors.helper";
import ListChatFlowService from "../services/ChatFlowServices/ListChatFlowService";
import CreateChatFlowService from "../services/ChatFlowServices/CreateChatFlowService";
import UpdateChatFlowService from "../services/ChatFlowServices/UpdateChatFlowService";
import DeleteChatFlowService from "../services/ChatFlowServices/DeleteChatFlowService";
import { ImportChatFlowService } from "../services/ChatFlowServices/ImportChatFlowService";
import { ExportChatFlowService } from "../services/ChatFlowServices/ExportChatFlowService";
import { logger } from "../utils/logger";

interface Line {
  connector: string;
  from: string;
  paintStyle: string | any;
  to: string;
}
interface Configuration {
  maxRetryBotMessage: {
    destiny: string;
    number: number;
    type: number;
  };
  notOptionsSelectMessage: {
    message: string;
    step: string;
  };
  notResponseMessage: {
    destiny: string;
    time: number;
    type: number;
  };
}
interface NodeList {
  ico?: string;
  id: string;
  left: string;
  name: string;
  status: string;
  style?: string | any;
  top: string;
  type?: string;
  viewOnly?: boolean;
  configurations?: Configuration;
  actions?: [];
  conditions?: [];
  interactions?: [];
}

interface Flow {
  name: string;
  lineList: Line[];
  nodeList: NodeList[];
}

interface ChatFlowData {
  flow: Flow;
  name: string;
  userId: number;
  isActive: boolean;
  celularTeste?: string;
  tenantId: number;
}

export const createChatFlow = async (
  request: FastifyRequest<{
    Body: {
      flow: Flow;
      name: string;
      celularTeste: string;
    };
  }>,
  reply: FastifyReply
) => {
  const { celularTeste, flow: flowFromBody, name } = request.body;

  try {
    const { tenantId, profile, id } = request.user as any;
    if (profile !== "admin") {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    const newFlow: ChatFlowData = {
      flow: Object.assign({}, flowFromBody),
      name: name,
      isActive: true,
      userId: id,
      tenantId,
      celularTeste: celularTeste,
    };
    const flow = await CreateChatFlowService(newFlow);
    return reply.code(200).send(flow);
  } catch (error) {
    logger.error("Error in createChatFlow",error )
    return handleServerError(reply, error);
  }
};

export const listAllChatFlow = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { tenantId, profile } = request.user as any;
    if (profile !== "admin") {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    const chatFlows = await ListChatFlowService({ tenantId });
    return reply.code(200).send(chatFlows);
  } catch (error) {
  logger.error("Error in listAllChatFlow",error )
    return handleServerError(reply, error);
  }
};

export const updateChatFlow = async (
  request: FastifyRequest<{
    Body: {
      flow: Flow;
      name: string;
      celularTeste: string;
      isActive: boolean;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { tenantId, profile, id } = request.user as any;
    const { chatFlowId } = request.params as any;
    if (profile !== "admin") {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    const { celularTeste, flow: flowFromBody, name, isActive } = request.body;
    const updateParams: ChatFlowData = {
      flow: flowFromBody,
      celularTeste: celularTeste,
      name: name,
      isActive,
      userId: id,
      tenantId,
    };

    const flowUpdated = await UpdateChatFlowService({
      chatFlowData: updateParams,
      tenantId,
      chatFlowId,
    });
    return reply.code(200).send(flowUpdated);
  } catch (error) {
    logger.error("Error in updateChatFlow",error )
    return handleServerError(reply, error);
  }
};

export const removeChatFlow = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { chatFlowId } = request.params as any;
    const { tenantId, profile } = request.user as any;
    if (profile !== "admin") {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    await DeleteChatFlowService({ id: chatFlowId, tenantId });
    return reply.code(200).send({ message: "Flow deleted" });
  } catch (error) {
    logger.error("Error in removeChatFlow",error )
    return handleServerError(reply, error);
  }
};

export const importFlow = async (
  request: FastifyRequest<{ Body: { flow: any } }>,
  reply: FastifyReply
) => {
  try {
    const { chatFlowId } = request.params as any;
    const { tenantId, profile } = request.user as any;

    if (profile !== "admin") {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    const chatFlow = await ImportChatFlowService({
      chatFlowData: request.body.flow,
      chatFlowId,
      tenantId,
    });
    return reply.code(200).send(chatFlow);
  } catch (error) {
    logger.error("Error in importFlow",error )
    return handleServerError(reply, error);
  }
};

export const exportFlow = async (
  request: FastifyRequest<{ Body: { flow: any } }>,
  reply: FastifyReply
) => {
  try {
    const { chatFlowId } = request.params as any;
    const { tenantId, profile } = request.user as any;

    if (profile !== "admin") {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    const jsonFlow = await ExportChatFlowService({ tenantId, id: chatFlowId });
    return reply
      .header(
        "Content-Disposition",
        `attachment; filename=${jsonFlow.name}.json`
      )
      .header("Content-Type", "application/json")
      .code(200)
      .send(jsonFlow);
  } catch (error) {
    logger.error("Error in exportFlow",error )
    return handleServerError(reply, error);
  }
};
