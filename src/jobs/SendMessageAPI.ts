import { logger } from "../utils/logger";
import { getWbot } from "../lib/wbot";
import { addJob } from "../lib/Queue";
import { getNumberId } from "../utils/getNumberId";
import ApiConfig from "../models/ApiConfig";
import { pupa } from "../utils/pupa";

type dataProps = {
  apiId: string;
  apiConfig: ApiConfig;
  message: string;
  number: string;
  sessionId: number;
  tenantId: number;
};

const buildMessageBody = (message: string) => {
  return pupa(message, {
    name: "",
  });
};

export default {
  key: "SendMessageAPI",
  options: {
    delay: 6000,
    attempts: 2,
    removeOnComplete: 2,
    removeOnFail: 5,
  },
  async handle(data: dataProps) {
    try {
      const { apiConfig, message, number, sessionId } = data;
      const wbot = getWbot(sessionId);

      const idNumber = getNumberId(number);

      if (!idNumber) {
        const payload = {
          ack: -1,
          body: message,
          messageId: "",
          number: number,
          error: "number invalid in whatsapp",
          type: "hookMessageStatus",
          authToken: apiConfig.authToken,
        };

        if (data?.apiConfig?.urlMessageStatus) {
          await addJob("WebHooksAPI", {
            url: data.apiConfig.urlMessageStatus,
            type: payload.type,
            payload,
          });
        }
        return payload;
      }
      let serialized = await wbot.getContact(idNumber);

      if (!serialized) {
        const wid = await wbot.checkNumberStatus(idNumber);
        if (wid.canReceiveMessage === false) {
          return;
        }
        serialized = {
          id: {
            _serialized: wid.id._serialized,
          },
        };
      }

      await wbot.sendText(serialized.id._serialized, buildMessageBody(message));
    } catch (error: any) {
      logger.error({ message: "Error send message api", error });
      throw new Error(error);
    }
  },
};
