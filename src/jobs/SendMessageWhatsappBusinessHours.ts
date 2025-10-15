import { getWbot } from "../lib/wbot";
import { logger } from "../utils/logger";

export default {
  key: "SendMessageWhatsappBusinessHours",
  options: {
    delay: 60000,
    attempts: 10,
    removeOnComplete: 2,
    removeOnFail: 5,
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

      return {
        success: true,
        message: JSON.stringify(result, null, 2),
      };
    } catch (error: any) {
      logger.error(`Error enviar message business hours: ${error}`);
      throw new Error(error);
    }
  },
};
