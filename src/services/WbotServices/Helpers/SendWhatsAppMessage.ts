import type { Message as WbotMessage } from "wbotconnect";
import Ticket from "../../../models/Ticket";
import Message from "../../../models/Message";
import GetTicketWbot from "./GetTicketWbot";
import UserMessagesLog from "../../../models/UserMessagesLog";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../errors/errors.helper";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
  userId?: number;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  userId,
}: Request): Promise<WbotMessage> => {
  let quotedMsgSerializedId: string | undefined;

  if (quotedMsg) {
    quotedMsgSerializedId = quotedMsg.messageId;
  }

  const wbot = await GetTicketWbot(ticket);
  try {
    const sendMessage = await wbot.sendText(
      ticket.contact.serializednumber!,
      body,
      {
        quotedMsg: quotedMsgSerializedId,
      }
    );

    await ticket.update({
      lastMessage: body.length > 255 ? body.slice(0, 252) + "..." : body,
      lastMessageAt: new Date().getTime(),
    });

    try {
      if (userId) {
        await UserMessagesLog.create({
          messageId: sendMessage.id,
          userId,
          ticketId: ticket.id,
        } as UserMessagesLog);
      }
    } catch (error) {
      logger.error(`Error criar log mensagem ${error}`);
    }
    return sendMessage;
  } catch (err) {
    logger.error(`SendWhatsAppMessage | Error: ${err}`);
    // await StartWhatsAppSessionVerify(ticket.whatsappId, err);
    throw new AppError("ERR_SENDING_WAPP_MSG", 501);
  }
};

export default SendWhatsAppMessage;
