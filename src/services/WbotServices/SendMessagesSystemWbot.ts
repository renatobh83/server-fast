import { join } from "node:path";

import type { Message as WbotMessage, Whatsapp } from "wbotconnect";
import { Op } from "sequelize";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import { sleepRandomTime } from "../../utils/sleepRandomTime";
import GetWbotMessage from "./Helpers/GetWbotMessage";

interface Session extends Whatsapp {
  id: number;
}
type CustomWbotMessage = Omit<WbotMessage, "id"> & {
  id: { _serialized: string }; // Redefinindo o tipo de `id`
};

export const SendMessagesSystemWbot = async (
  wbot: Session,
  tenantId: number | string
): Promise<void> => {
  const where = {
    fromMe: true,
    messageId: { [Op.is]: null } as any,
    status: "pending",
    [Op.or]: [
      {
        scheduleDate: {
          [Op.lte]: new Date(),
        },
      },
      {
        scheduleDate: { [Op.is]: null } as any,
      },
    ],
  };
  const messages = await Message.findAll({
    where,
    include: [
      {
        model: Contact,
        as: "contact",
        where: {
          tenantId,
          number: {
            [Op.notIn]: ["", "null"],
          },
        },
      },
      {
        model: Ticket,
        as: "ticket",
        where: {
          tenantId,
          [Op.or]: {
            status: { [Op.ne]: "closed" },
            isFarewellMessage: true,
          },
          channel: "whatsapp",
          whatsappId: wbot.id,
        },
        include: ["contact"],
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"],
      },
    ],
    order: [["createdAt", "ASC"]],
  });
  let sendedMessage: any;

  // logger.info(
  //   `SystemWbot SendMessages | Count: ${messages.length} | Tenant: ${tenantId} `
  // );

  for (const message of messages) {
    let quotedMsgSerializedId: string | undefined;
    const { ticket } = message;
    const contactNumber = ticket.contact.serializednumber!;

    if (message.quotedMsg) {
      const inCache: CustomWbotMessage | undefined = await GetWbotMessage(
        ticket,
        message.quotedMsg.messageId,
        200
      );
      if (inCache) {
        quotedMsgSerializedId = inCache?.id?._serialized || undefined;
      } else {
        quotedMsgSerializedId = undefined;
      }
    }

    try {
      if (message.mediaType !== "chat" && message.mediaName) {
        const customPath = join(__dirname, "..", "..", "..", "public");
        const mediaPath = join(customPath, message.mediaName);
        sendedMessage = await wbot.sendFile(contactNumber, mediaPath, {
          quotedMsg: quotedMsgSerializedId,
        });
        logger.info("sendMessage media");
      } else {
        sendedMessage = await wbot.sendText(contactNumber, message.body, {
          quotedMsg: quotedMsgSerializedId,
          linkPreview: false, // fix: send a message takes 2 seconds when there's a link on message body
        });
        logger.info("sendMessage text");
      }

      // enviar old_id para substituir no front a mensagem corretamente
      const messageToUpdate = {
        ...message,
        ...sendedMessage,
        id: message.id,
        messageId: sendedMessage.id.id,
        status: "sended",
      };
      // TODO removido udate
      // eslint-disable-next-line
      await Message.update(
        { ...messageToUpdate },
        { where: { id: message.id } }
      );

      logger.info("Message Update");
      // await SetTicketMessagesAsRead(ticket);

      // delay para processamento da mensagem
      await sleepRandomTime({
        minMilliseconds: Number(process.env.MIN_SLEEP_INTERVAL || 500),
        maxMilliseconds: Number(process.env.MAX_SLEEP_INTERVAL || 2000),
      });

      logger.info("sendMessage", sendedMessage.id.id);
    } catch (error: any) {
      const idMessage = message.id;
      const ticketId = message.ticket.id;

      if (error.code === "ENOENT") {
        await Message.destroy({
          where: { id: message.id },
        });
      }

      logger.error(
        `Error message is (tenant: ${tenantId} | Ticket: ${ticketId})`
      );
      logger.error(`Error send message (id: ${idMessage})::${error}`);
    }
  }
};
