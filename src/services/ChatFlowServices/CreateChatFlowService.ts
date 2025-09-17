import { writeFile } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import ChatFlow from "../../models/ChatFlow";
import { AppError } from "../../errors/errors.helper";

const writeFileAsync = promisify(writeFile);

interface Request {
  flow: any;
  name: string;
  isActive: boolean;
  userId: number;
  tenantId: number;
  celularTeste?: string;
}

const CreateChatFlowService = async ({
  flow,
  userId,
  tenantId,
  name,
  isActive,
  celularTeste,
}: Request): Promise<ChatFlow> => {
  try {
    for await (const node of flow.nodeList) {
      if (node.type === "node") {
        for await (const item of node.data?.interactions) {
          if (item.type === "MediaField" && item.data.media) {
            const newName = `${new Date().getTime()}-${item.data.name}`;
            await writeFileAsync(
              join(__dirname, "..", "..", "..", "public", newName),
              item.data.media.split("base64")[1],
              "base64"
            );

            item.data.media = undefined;
            item.data.fileName = item.data.name;
            item.data.mediaUrl = newName;
          }
        }
      }
    }

    const chatFlow = await ChatFlow.create({
      flow,
      userId,
      tenantId,
      name,
      isActive,
      celularTeste,
    });

    return chatFlow;
  } catch (error: any) {
    throw new AppError("ERR_CREAT_CHAT_FLOW", 500);
  }
};

export default CreateChatFlowService;
