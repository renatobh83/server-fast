import { getWbot } from "../lib/wbot";
import { SendMessagesSystemWbot } from "../services/WbotServices/SendMessagesSystemWbot";
import { logger } from "../utils/logger";

const sending: any = {};

export default {
  key: "SendMessages",
  options: {
    attempts: 0,
    removeOnComplete: 2,
    removeOnFail: 5,
  },
  async handle(data: any) {
    try {
      logger.info(`Sending Tenant Initiated: ${data.tenantId}`);
      if (sending[data.tenantId]) return;
      const wbot = getWbot(data.sessionId);
      sending[data.tenantId] = true;
      await SendMessagesSystemWbot(wbot, data.tenantId);
      sending[data.tenantId] = false;
      logger.info(`Finalized Sending Tenant: ${data.tenantId}`);
    } catch (error: any) {
      logger.error({ message: "Error send messages", error });
      sending[data.tenantId] = false;
      throw new Error(error);
    }
  },
};
