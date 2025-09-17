import { AppError } from "../../errors/errors.helper";
import ChatFlow from "../../models/ChatFlow";

interface ChatFlowData {
  flow: any;
  name: string;
  userId: number;
  isActive: boolean;
  celularTeste?: string;
}

interface Request {
  chatFlowData: ChatFlowData;
  chatFlowId: string;
  tenantId: string | number;
}

export const ImportChatFlowService = async ({
  chatFlowData,
  chatFlowId,
  tenantId,
}: Request): Promise<ChatFlow> => {
  try {
    const chatFlowFilter = {
      id: chatFlowId,
      tenantId,
    };
    const findOptions = {
      where: chatFlowFilter,
      attributes: ["id", "name", "flow", "userId", "isActive", "celularTeste"],
    };
    const chatFlow = await ChatFlow.findOne(findOptions);

    if (!chatFlow) {
      throw new AppError("ERR_NO_CHAT_FLOW_FOUND", 404);
    }

    await chatFlow.update({ flow: chatFlowData });

    await chatFlow.reload();

    return chatFlow;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_IMPORT_CHAT_FLOW_SERVICE", 502);
  }
};
