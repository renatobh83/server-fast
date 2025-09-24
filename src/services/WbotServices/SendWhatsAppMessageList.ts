import Ticket from "../../models/Ticket";
import GetTicketWbot from "./Helpers/GetTicketWbot";
import type { Chat, Message as WbotMessage } from "wbotconnect";
import VerifyContact from "./Helpers/VerifyContact";
import VerifyMessage from "./VerifyMessage";
import { AppError } from "../../errors/errors.helper";
import { logger } from "../../utils/logger";

interface Request {
  options: any;
  ticket: Ticket;
}
export const SendWhatsMessageList = async ({
  options,
  ticket,
}: Request): Promise<WbotMessage> => {
  const wbot = await GetTicketWbot(ticket);

  try {
    const sendedMessage = await wbot.sendListMessage(
      ticket.contact.serializednumber!,
      options
    );

    const chat: Chat = await wbot.getChatById(sendedMessage.to);
    const contact = await VerifyContact(chat, ticket.tenantId);
    await VerifyMessage(sendedMessage, ticket, contact);

    return sendedMessage;
  } catch (err: any) {
    logger.error(`SendWhatsMessageList | Error: ${err}`);
    // await StartWhatsAppSessionVerify(ticket.whatsappId, err);
    throw new AppError("ERR_SENDING_WAPP_MSG", 501);
  }
};
