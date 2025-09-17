import { writeFile } from "node:fs";
import { join } from "node:path";

import { promisify } from "node:util";
import ChatFlow from "../../models/ChatFlow";
import { AppError } from "../../errors/errors.helper";
const writeFileAsync = promisify(writeFile);

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

const UpdateChatFlowService = async ({
  chatFlowData,
  chatFlowId,
  tenantId,
}: Request): Promise<ChatFlow> => {
  try {
    const { name, flow, userId } = chatFlowData;

    const cahtFlow = await ChatFlow.findOne({
      where: { id: chatFlowId, tenantId },
      attributes: ["id", "name", "flow", "userId", "isActive", "celularTeste"],
    });

    if (!cahtFlow) {
      throw new AppError("ERR_NO_CHAT_FLOW_FOUND", 404);
    }
    for await (const node of flow.nodeList) {
      if (node.type === "node") {
        for await (const item of node.data.interactions) {
          if (item.type === "MediaField" && item.data.media) {
            const newName = `${new Date().getTime()}-${item.data.name}`;
            await writeFileAsync(
              join(__dirname, "..", "..", "..", "public", newName),
              item.data.media.split("base64")[1],
              "base64"
            );

            item.data.media = undefined;
            item.data.mediaUrl = newName;
          }
          // ajustar para retirar a informação da URL
          if (item.type === "MediaField" && item.data.mediaUrl) {
            const urlSplit = item.data.mediaUrl.split("/");
            item.data.mediaUrl = urlSplit[urlSplit.length - 1];
          }
        }
      }
    }

    await cahtFlow.update({
      name,
      flow: flow,
      userId,
      isActive: flow.isActive,
      celularTeste: flow.celularTeste,
    });

    await cahtFlow.reload({
      attributes: ["id", "name", "flow", "userId", "isActive", "celularTeste"],
    });

    return cahtFlow;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_UPDATE_CHAT_FLOW_SERVICE", 502);
  }
};

export default UpdateChatFlowService;
