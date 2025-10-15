/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { logger } from "../utils/logger";

interface HandlerPayload {
  url: string;
  type: string;
  payload: any;
}

export default {
  key: "WebHooksAPI",
  options: {
    delay: 6000,
    removeOnComplete: 2,
    removeOnFail: 5,
    attempts: 50,
  },
  async handle(data: HandlerPayload) {
    try {
      let payload = {};

      // return se não houver url informada
      if (!data?.url) {
        return { message: "url configurar no webhook não existe." };
      }

      if (data.type === "hookMessageStatus") {
        payload = {
          ack: data.payload.ack,
          messageId: data.payload.messageId,
          externalKey: data.payload.externalKey,
          type: data.type,
        };
      }
      if (data.type === "hookMessage") {
        payload = {
          timestamp: data.payload.timestamp,
          message: data.payload.msg,
          messageId: data.payload.messageId,
          ticketId: data.payload.ticketId,
          externalKey: data.payload.externalKey,
          type: data.type,
        };
      }

      if (data.type === "hookSessionStatus") {
        payload = {
          name: data.payload.name,
          number: data.payload.number,
          status: data.payload.status,
          qrcode: data.payload.qrcode,
          timestamp: data.payload.timestamp,
          type: data.type,
        };
      }

      if (data.payload.authToken) {
        await axios.post(data.url, payload, {
          headers: { authorization: data.payload.authToken },
        });
      } else {
        await axios.post(data.url, data.payload);
      }

      logger.info(
        `Queue WebHooksAPI success: Data: ${data} Payload: ${payload}`
      );
      return {
        data,
        payload,
      };
    } catch (error) {
      logger.error(`Error send message api: ${error}`);
    }
  },
};
