import { AppError } from "../../errors/errors.helper";
import type Ticket from "../../models/Ticket";
import UserMessagesLog from "../../models/UserMessagesLog";
import { logger } from "../../utils/logger";
import GetTicketWbot from "./Helpers/GetTicketWbot";

interface Request {
  message: any;
  ticket: Ticket;
  userId?: number;
  contact: any;
}

export const SendWhatsAppForwardMessage = async ({
  message,
  ticket,
  userId,
  contact,
}: Request): Promise<void> => {
  try {
    const wbot = await GetTicketWbot(ticket);

    // const wppContact = await wbot.checkNumberStatus(contact.number);

    const media = message.mediaUrl
      ? await wbot.downloadMedia(message.messageId)
      : "";

    await wbot.forwardMessage(contact.serializednumber, message.messageId);
    await ticket.update({
      lastMessage:
        message.body.length > 255
          ? message.body.slice(0, 252) + "..."
          : message.body,
      lastMessageAt: new Date().getTime(),
    });
    try {
      if (userId) {
        await UserMessagesLog.create({
          messageId: message.messageId,
          userId,
          ticketId: ticket.id,
        } as UserMessagesLog);
      }
    } catch (error) {
      logger.error(`Error criar log mensagem ${error}`);
    }
  } catch (err) {
    logger.error(`forwardMessage | Error: ${JSON.stringify(err)}`);

    throw new AppError("ERR_SENDING_WAPP_MSG", 501);
  }
};
