import { Chat, Message, Whatsapp } from "wbotconnect";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { isValidMsg } from "./Helpers/isValidMsg";
import Setting from "../../models/Setting";
import VerifyContact from "./Helpers/VerifyContact";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import VerifyMessage from "./VerifyMessage";

interface Session extends Whatsapp {
  id: number;
}

export const HandleMessageSend = async (
  message: Message,
  wbot: Session
): Promise<void> => {
  const whatsapp = await ShowWhatsAppService({ id: wbot.id });

  const { tenantId } = whatsapp;

  if (!isValidMsg(message)) {
    return;
  }
  const chat: Chat = await wbot.getChatById(message.to);
  const Settingdb = await Setting.findOne({
    where: { key: "ignoreGroupMsg", tenantId },
  });
  if (
    Settingdb?.value === "enabled" &&
    (chat.isGroup || message.from === "status@broadcast")
  ) {
    return;
  }
  const contact = await VerifyContact(chat, tenantId);
  const ticket = await FindOrCreateTicketService({
    contact,
    whatsappId: wbot.id!,
    unreadMessages: 0,
    tenantId,
    groupContact: chat.isGroup,
    msg: message,
    channel: "whatsapp",
  });
  if (message.filehash) {
    // await VerifyMediaMessage(msg, ticket, contact, wbot);
  } else {
    await VerifyMessage(message, ticket, contact);
  }
  //     const isBusinessHours = await verifyBusinessHours(msg, ticket);

  //   if (isBusinessHours) await VerifyStepsChatFlowTicket(msg, ticket);
};
