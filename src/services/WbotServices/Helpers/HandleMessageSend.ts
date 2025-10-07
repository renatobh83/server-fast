import { Chat, Message, Whatsapp as wbot } from "wbotconnect";
import ShowWhatsAppService from "../../WhatsappService/ShowWhatsAppService";
import { isValidMsg } from "./isValidMsg";
import Setting from "../../../models/Setting";
import VerifyContact from "./VerifyContact";
import FindOrCreateTicketService from "../../TicketServices/FindOrCreateTicketService";
import VerifyMessage from "../VerifyMessage";
import VerifyMediaMessage from "./VerifyMediaMessage";
import VerifyStepsChatFlowTicket from "../../ChatFlowServices/VerifyStepsChatFlowTicket";
import verifyBusinessHours from "./VerifyBusinessHours";
import { RedisKeys } from "../../../constants/redisKeys";
import { getCache, setCache } from "../../../utils/cacheRedis";
import Whatsapp from "../../../models/Whatsapp";

interface Session extends wbot {
  id: number;
}

export const HandleMessageSend = async (
  message: Message,
  wbot: Session
): Promise<void> => {
  let whatsapp = (await getCache(RedisKeys.canalService(wbot.id))) as Whatsapp;

  if (!whatsapp) {
    whatsapp = await ShowWhatsAppService({ id: wbot.id });
    await setCache(RedisKeys.canalService(wbot.id), whatsapp);
  }

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

  if (message.filehash || message.mimetype) {
    await VerifyMediaMessage(message, ticket, contact, wbot);
  } else {
    await VerifyMessage(message, ticket, contact);
  }
  const isBusinessHours = await verifyBusinessHours(message, ticket);

  if (isBusinessHours) await VerifyStepsChatFlowTicket(message, ticket);
};
