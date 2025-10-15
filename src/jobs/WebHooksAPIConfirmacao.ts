import { logger } from "../utils/logger";

interface Data {
  data: any;
  tenantId: string;
}

interface HandlerPayload {
  data: Data;
}

export default {
  key: "WebHooksAPIConfirmacao",
  options: {
    delay: 6000,
    attempts: 5,
    removeOnComplete: 2,
    removeOnFail: 5,
  },

  async handle({ data }: HandlerPayload) {
    try {
      const payload = {};

      logger.info(`Queue WebHooksAPI success: Data: ${data}`);
      return {
        success: true,
        message: "Queue WebHooksAPI",
      };
    } catch (error) {
      logger.error(`Error send message api: ${error}`);
    }
  },
};
