import { getWbot } from "../lib/wbot";
import { logger } from "../utils/logger";

export default {
  key: "SendMessageWhatsappBusinessHours",
  options: {
    delay: 60000,
    attempts: 10,
    removeOnComplete: 2,
    removeOnFail: 5,
    backoff: {
      type: "fixed",
      delay: 60000 * 5, // 5 min
    },
  },
  async handle(data: any) {
    try {
      const wbot = getWbot(data.ticket.whatsappId);
      const message = await wbot.sendText(
        `${data.ticket.contact.number}@c.us`,
        data.tenant.messageBusinessHours,
        {
          linkPreview: false,
        }
      );

      const result = {
        message,
        messageBusinessHours: data.tenant.messageBusinessHours,
        ticket: data.ticket,
      };

      return result;
    } catch (error: any) {
      logger.error(`Error enviar message business hours: ${error}`);
      throw new Error(error);
    }
  },
};
