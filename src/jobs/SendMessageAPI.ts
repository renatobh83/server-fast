import fs from "node:fs";
import type { Message as WbotMessage } from "wbotconnect";
import FindOrCreateTicketService from "../services/TicketServices/FindOrCreateTicketService";
import { logger } from "../utils/logger";
import VerifyContact from "../services/WbotServices/Helpers/VerifyContact";

import { getWbot } from "../lib/wbot";
import { CreateMessageSystemService } from "../services/MessageServices/CreateMessageSystemService";
import { addJob } from "../lib/Queue";
import { getNumberId } from "../utils/getNumberId";

export default {
  key: "SendMessageAPI",
  options: {
    delay: 6000,
    attempts: 50,
    removeOnComplete: 2,
    removeOnFail: 5,
    backoff: {
      type: "fixed",
      delay: 60000 * 3, // 3 min
    },
  },
  async handle(data: any) {
    try {
      const wbot = getWbot(data.sessionId);

      const message: any = {} as WbotMessage;
      try {
        const idNumber = getNumberId(data.number);

        if (!idNumber) {
          const payload = {
            ack: -1,
            body: data.body,
            messageId: "",
            number: data.number,
            externalKey: data.externalKey,
            error: "number invalid in whatsapp",
            type: "hookMessageStatus",
            authToken: data.authToken,
          };
          if (data.media) {
            // excluir o arquivo se o número não existir
            fs.unlinkSync(data.media.path);
          }
          if (data?.apiConfig?.urlMessageStatus) {
            await addJob("WebHooksAPI", {
              url: data.apiConfig.urlMessageStatus,
              type: payload.type,
              payload,
            });
          }
          return payload;
        }
        // '559891191708@c.us'
        let msgContact = (await wbot.getContact(idNumber)) as any;

        if (!msgContact) {
          const wid = await wbot.checkNumberStatus(idNumber);
          if (wid.canReceiveMessage === false) {
            return;
          }
          msgContact = {
            id: wid.id,
            name: wid.id.user,
            isUser: !wid.isBusiness,
            isWAContact: true,
          };
        }
        const contact = await VerifyContact(msgContact, data.tenantId);

        const ticket = await FindOrCreateTicketService({
          contact,
          whatsappId: wbot.id!,
          unreadMessages: 0,
          tenantId: data.tenantId,
          groupContact: undefined,
          msg: data,
          channel: "whatsapp",
        });
        await CreateMessageSystemService({
          message: data,
          tenantId: data.tenantId,
          ticket,
          status: "pending",
        });
        await ticket.update({
          apiConfig: {
            ...data.apiConfig,
            externalKey: data.externalKey,
          },
        });
      } catch (error: any) {
        const payload = {
          ack: -2,
          body: data.body,
          messageId: "",
          number: data.number,
          externalKey: data.externalKey,
          error: "error session",
          type: "hookMessageStatus",
          authToken: data.authToken,
        };

        if (data?.apiConfig?.urlMessageStatus) {
          await addJob("WebHooksAPI", {
            url: data.apiConfig.urlMessageStatus,
            type: payload.type,
            payload,
          });
        }
        throw new Error(error);
      }
      // const apiMessage = await UpsertMessageAPIService({
      //   sessionId: data.sessionId,
      //   messageId: message.id.id,
      //   body: data.body,
      //   ack: message.ack,
      //   number: data.number,
      //   mediaName: data?.media?.filename,
      //   mediaUrl: data.mediaUrl,
      //   timestamp: message.timestamp,
      //   externalKey: data.externalKey,
      //   messageWA: message,
      //   apiConfig: data.apiConfig,
      //   tenantId: data.tenantId
      // });
    } catch (error: any) {
      logger.error({ message: "Error send message api", error });
      throw new Error(error);
    }
  },
};
