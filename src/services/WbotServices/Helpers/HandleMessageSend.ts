import { Chat, Message, Whatsapp as wbot } from "wbotconnect";
import ShowWhatsAppService from "../../WhatsappService/ShowWhatsAppService";
import { isValidMsg } from "./isValidMsg";
import VerifyContact from "./VerifyContact";
import FindOrCreateTicketService from "../../TicketServices/FindOrCreateTicketService";
import VerifyMessage from "../VerifyMessage";
import VerifyMediaMessage from "./VerifyMediaMessage";
import VerifyStepsChatFlowTicket from "../../ChatFlowServices/VerifyStepsChatFlowTicket";
import verifyBusinessHours from "./VerifyBusinessHours";
import { RedisKeys } from "../../../constants/redisKeys";
import { getCache, setCache } from "../../../utils/cacheRedis";
import Contact from "../../../models/Contact";
import { getCachedChannel } from "./HandleMessageReceived";

import { AppError } from "../../../errors/errors.helper";

interface Session extends wbot {
  id: number;
}

export const HandleMessageSend = async (
  message: Message,
  wbot: Session
): Promise<void> => {
  const whatsapp = await getCachedChannel(wbot.id);
  if (!whatsapp) {
    throw new AppError("SESSION_NO_FOUND", 404);
  }
  const { tenantId } = whatsapp;

  if (!isValidMsg(message)) {
    return;
  }
  const chat: Chat = await wbot.getChatById(message.to);

  let contact: Contact;
  contact = (await getCache(
    RedisKeys.ticketContactCache(tenantId, chat.id._serialized)
  )) as Contact;
  if (!contact) {
    contact = await VerifyContact(chat, tenantId);
    await setCache(
      RedisKeys.ticketContactCache(tenantId, chat.id._serialized),
      contact
    );
  }

  const ticket = await FindOrCreateTicketService({
    contact,
    whatsappId: wbot.id,
    unreadMessages: 0,
    tenantId,
    groupContact: chat.isGroup,
    msg: message,
    channel: "whatsapp",
  });

  if (ticket?.isFarewellMessage) {
    return;
  }

  if (message.filehash || message.mimetype) {
    await VerifyMediaMessage(message, ticket, contact, wbot);
  } else {
    await VerifyMessage(message, ticket, contact);
  }
  const isBusinessHours = await verifyBusinessHours(message, ticket);

  if (isBusinessHours) await VerifyStepsChatFlowTicket(message, ticket);
};
