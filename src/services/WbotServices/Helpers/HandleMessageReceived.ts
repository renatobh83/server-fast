import { Chat, Message, Whatsapp as wbot } from "wbotconnect";

import ShowWhatsAppService from "../../WhatsappService/ShowWhatsAppService";
import { isValidMsg } from "./isValidMsg";
import Setting from "../../../models/Setting";
import { ProcessReturnMessage } from "../../IntegracoesServices/Genesis/Externa/ProcessReturnMessage";
import FindOrCreateTicketService from "../../TicketServices/FindOrCreateTicketService";
import VerifyMessage from "../VerifyMessage";
import VerifyContact from "./VerifyContact";
import VerifyMediaMessage from "./VerifyMediaMessage";
import VerifyStepsChatFlowTicket from "../../ChatFlowServices/VerifyStepsChatFlowTicket";
import { getCache, setCache } from "../../../utils/cacheRedis";
import { RedisKeys } from "../../../constants/redisKeys";
import Whatsapp from "../../../models/Whatsapp";
import IntegracaoGenesisConfirmacao from "../../../models/IntegracaoGenesisConfirmacao";
import { Op } from "sequelize";
import { GetContactByLid } from "./GetContactBYLid";

interface Session extends wbot {
  id: number;
}
// Guarda último horário de mensagem por ticket
const lastMessageTime = new Map<number, number>();

// Intervalo para ignorar mensagens rápidas (em segundos)
const MIN_INTERVAL_SECONDS = 2;
const MAX_INTERVAL_SECONDS = 3;

// Tempo para limpar registros antigos (em ms)
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutos

// Função para agendar remoção do ticket do Map
function scheduleCleanup(ticketId: number) {
  setTimeout(() => {
    lastMessageTime.delete(ticketId);
    console.log(`🗑 Ticket ${ticketId} removido do controle de tempo`);
  }, CLEANUP_INTERVAL);
}
export const HandleMessageReceived = async (
  msg: Message,
  wbot: Session
): Promise<void> => {
  // console.log("Recebido", new Date().toLocaleTimeString())

  let whatsapp = (await getCache(RedisKeys.canalService(wbot.id))) as Whatsapp;
  if (!whatsapp) {
    whatsapp = await ShowWhatsAppService({ id: wbot.id });
    await setCache(RedisKeys.canalService(wbot.id), whatsapp);
  }

  const { tenantId } = whatsapp;

  if (!isValidMsg(msg)) {
    return;
  }
  const chat: Chat = await wbot.getChatById(msg.from);

  const Settingdb = await Setting.findOne({
    where: { key: "ignoreGroupMsg", tenantId },
  });

  if (
    Settingdb?.value === "enabled" &&
    (chat.isGroup || msg.from === "status@broadcast")
  ) {
    return;
  }
  const contact = await VerifyContact(chat, tenantId);

  let authorGrupMessage: any = "";

  if (msg.isGroupMsg) {
    const number = await GetContactByLid(msg.author, wbot);
    authorGrupMessage = number;
  }

  // const integracaoMessage = await IntegracaoGenesisConfirmacao.findOne({
  //   where: { contato: chat.id._serialized, closedAt: { [Op.is]: null } },
  // });
  // // console.log("integracaoMessage", new Date().toLocaleTimeString())

  // if (integracaoMessage) {
  //   ProcessReturnMessage(msg, tenantId);
  //   return;
  // }

  const ticket = await FindOrCreateTicketService({
    contact,
    whatsappId: wbot.id,
    unreadMessages: chat.unreadCount,
    tenantId,
    groupContact: chat.isGroup,
    msg,
    channel: "whatsapp",
  });

  //   // 🔹 Usando o timestamp real da mensagem
  //   const msgTime = msg.timestamp; // já vem em segundos
  //   const lastTime = lastMessageTime.get(ticket.id) || 0;
  //   const diffSeconds = msgTime - lastTime;

  //   if (
  //     lastTime > 0 &&
  //     diffSeconds >= MIN_INTERVAL_SECONDS &&
  //     diffSeconds <= MAX_INTERVAL_SECONDS
  //   ) {
  //     console.log(
  //       `⏱ Ignorando mensagem rápida do ticket ${ticket.id}, intervalo de ${diffSeconds}s`
  //     );
  //     return;
  //   }

  //   // Atualiza o horário e agenda limpeza
  //   lastMessageTime.set(ticket.id, msgTime);
  //   scheduleCleanup(ticket.id);

  if (msg.filehash) {
    await VerifyMediaMessage(msg, ticket, contact, wbot, authorGrupMessage);
  } else {
    await VerifyMessage(msg, ticket, contact, authorGrupMessage);
  }

  await VerifyStepsChatFlowTicket(msg, ticket);

  const apiConfig: any = ticket.apiConfig || {};

  if (
    !msg.fromMe &&
    !ticket.isGroup &&
    !ticket.answered &&
    apiConfig?.externalKey &&
    apiConfig?.urlMessageStatus
  ) {
    const payload = {
      timestamp: Date.now(),
      msg,
      messageId: msg.id,
      ticketId: ticket.id,
      externalKey: apiConfig?.externalKey,
      authToken: apiConfig?.authToken,
      type: "hookMessage",
    };
    // addJob("WebHooksAPI", {
    //     url: apiConfig.urlMessageStatus,
    //     type: payload.type,
    //     payload,
    // });
  }
};
