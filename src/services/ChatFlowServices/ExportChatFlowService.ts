import { AppError } from "../../errors/errors.helper";
import ChatFlow from "../../models/ChatFlow";

interface ExportChatFlowServiceProps {
  id: string;
  tenantId: number;
}
export const ExportChatFlowService = async ({
  id,
  tenantId,
}: ExportChatFlowServiceProps): Promise<any> => {
  try {
    const cahtFlow = await ChatFlow.findOne({
      where: { id, tenantId },
      attributes: ["flow"],
      raw: true,
    });
    if (!cahtFlow) {
      throw new AppError("ERR_NO_CHAT_FLOW_FOUND", 404);
    }
    const jsonContent = JSON.stringify(cahtFlow, null, 2);
    return jsonContent;
  } catch (error: any) {
    throw new AppError("ERR_EXPORT_CHAT_FLOW_SERVICE", 502);
  }
};
