import { Chat, Message, Whatsapp as wbot } from "wbotconnect";

import { isValidMsg } from "./isValidMsg";
import Setting from "../../../models/Setting";
import { ProcessReturnMessage } from "../../IntegracoesServices/Genesis/Externa/ProcessReturnMessage";
import FindOrCreateTicketService from "../../TicketServices/FindOrCreateTicketService";
import VerifyMessage from "../VerifyMessage";
import VerifyContact from "./VerifyContact";
import VerifyMediaMessage from "./VerifyMediaMessage";
import VerifyStepsChatFlowTicket, {
  isRetriesLimit,
  sendBotMessage,
} from "../../ChatFlowServices/VerifyStepsChatFlowTicket";

import IntegracaoGenesisConfirmacao from "../../../models/IntegracaoGenesisConfirmacao";
import { Op } from "sequelize";
import { GetContactByLid } from "./GetContactBYLid";
import Contact from "../../../models/Contact";
import Ticket from "../../../models/Ticket";

import { logger } from "../../../utils/logger";
import User from "../../../models/User";
import { redisClient } from "../../../lib/redis";
import ShowWhatsAppService from "../../WhatsappService/ShowWhatsAppService";
import Whatsapp from "../../../models/Whatsapp";
import { isValidFlowAnswer } from "../../../utils/isValidFlowAnswer";

interface Session extends wbot {
  id: number;
}
// Constantes para chaves Redis e TTLs
const REDIS_KEYS = {
  channel: (id: number) => `cache:wpp:channel:${id}`,
  contact: (whatsappId: number, serializedId: string) =>
    `cache:wpp:contact:${whatsappId}:${serializedId}`,
  ticketLock: (whatsappId: number, contactId: number) =>
    `lock:wpp:ticket:${whatsappId}:${contactId}`,
  settingIgnoreGroup: (tenantId: number | string) =>
    `cache:wpp:setting:ignoreGroup:${tenantId}`,
};
const TTL = {
  CACHE: 5 * 60, // 5 minutos para caches gerais
  LOCK: 10, // 15 segundos para um lock de criação de ticket
};

const commonIncludes = [
  { model: Contact, as: "contact" },
  { model: User, as: "user", attributes: ["id", "name"] },
  { association: "whatsapp", attributes: ["id", "name"] },
];

// ========================================================================
// FUNÇÕES DE CACHE REESCRITAS COM REDIS
// ========================================================================

export const getCachedChannel = async (
  whatsappId: number
): Promise<Whatsapp | null> => {
  const key = REDIS_KEYS.channel(whatsappId);
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);

    const channel = await ShowWhatsAppService({ id: whatsappId });
    if (channel) {
      await redisClient.set(key, JSON.stringify(channel), "EX", TTL.CACHE);
    }
    return channel;
  } catch (error) {
    logger.error(
      `Erro ao buscar canal (ID: ${whatsappId}) do cache ou DB:`,
      error
    );
    return null;
  }
};

const getCachedContact = async (
  chat: Chat,
  tenantId: number,
  whatsappId: number
): Promise<Contact | null> => {
  const key = REDIS_KEYS.contact(whatsappId, chat.id._serialized);
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);

    const contact = await VerifyContact(chat, tenantId);
    if (contact) {
      await redisClient.set(key, JSON.stringify(contact), "EX", TTL.CACHE);
    }
    return contact;
  } catch (error) {
    logger.error(
      `Erro ao buscar contato (ID: ${chat.id._serialized}) do cache ou DB:`,
      error
    );
    return null;
  }
};
// FUNÇÃO MELHORADA: Buscar ou criar ticket com prevenção de duplicação E verificação de status
export const findOrCreateTicketSafe = async (params: {
  contact: any;
  whatsappId: number;
  unreadMessages: number;
  tenantId: number;
  msg: any;
  channel: string;
  groupContact: boolean;
}): Promise<any> => {
  const { contact, whatsappId } = params;
  const lockKey = REDIS_KEYS.ticketLock(whatsappId, contact.id);

  // Tenta adquirir o lock distribuído
  const lockAcquired = await redisClient.set(
    lockKey,
    "locked",
    "EX",
    TTL.LOCK,
    "NX"
  );

  if (lockAcquired) {
    try {
      // Verifica se um ticket aberto já existe (pode ter sido criado em uma interação anterior)
      const existingTicket = await Ticket.findOne({
        where: { contactId: contact.id, whatsappId, status: "pending" },
        include: commonIncludes,
      });
      if (existingTicket) {
        logger.info(
          `[whatsapp] Ticket ${existingTicket.id} já existia. Usando-o.`
        );
        return { ticket: existingTicket, isNew: false };
      }
      // Se não existe, cria o novo ticket
      const newTicket = await FindOrCreateTicketService(params);
      logger.info(`[whatsapp] Novo ticket ${newTicket.id} criado.`);
      return { ticket: newTicket, isNew: true };
    } catch (error) {
      logger.error(
        `[whatsapp] Erro durante a criação do ticket (com lock): ${error}`
      );
      return { ticket: null, isNew: false };
    } finally {
      // Libera o lock para futuras operações
      await redisClient.del(lockKey);
      logger.info(`[whatsapp] Lock liberado para ${lockKey}.`);
    }
  } else {
    // === LOCK NÃO ADQUIRIDO: Somos um processo seguidor ===
    logger.info(
      `[whatsapp] Lock para ${lockKey} já existe. Aguardando ticket...`
    );
    // Espera um pouco para dar tempo ao primeiro processo de criar o ticket

    // Busca o ticket que o outro processo DEVE ter criado
    const ticket = await Ticket.findOne({
      where: { contactId: contact.id, whatsappId, status: "pending" },
      order: [["createdAt", "DESC"]], // Pega o mais recente para garantir
      include: commonIncludes,
    });
    if (ticket) {
      logger.info(`[whatsapp] Ticket ${ticket.id} encontrado após aguardar.`);
      return { ticket, isNew: false };
    } else {
      logger.error(
        `[whatsapp] Aguardou pelo lock, mas o ticket não foi encontrado. Isso pode indicar uma falha na criação pelo processo líder.`
      );
      return { ticket: null, isNew: false };
    }
  }
};

export const HandleMessageReceived = async (
  msg: Message,
  wbot: Session
): Promise<void> => {
  if (!isValidMsg(msg)) {
    return;
  }
  try {
    const whatsapp = await getCachedChannel(wbot.id);
    if (!whatsapp) {
      logger.error(
        `[whatsapp] Canal ${wbot.id} não encontrado ou falha ao buscar. Abortando.`
      );
      return;
    }
    const { tenantId } = whatsapp;

    const chat: Chat = await wbot.getChatById(msg.from);

    // Lógica para ignorar grupos
    const settingKey = REDIS_KEYS.settingIgnoreGroup(tenantId);
    let ignoreGroup = await redisClient.get(settingKey);
    if (!ignoreGroup) {
      const settingDb = await Setting.findOne({
        where: { key: "ignoreGroupMsg", tenantId },
      });
      ignoreGroup = settingDb?.value || "disabled";
      await redisClient.set(settingKey, ignoreGroup, "EX", TTL.CACHE);
    }
    if (
      ignoreGroup === "enabled" &&
      (chat.isGroup || msg.from === "status@broadcast")
    ) {
      return;
    }

    const integracaoMessage = await IntegracaoGenesisConfirmacao.findOne({
      where: { contato: chat.id._serialized, closedAt: { [Op.is]: null } },
    });
    // console.log("integracaoMessage", new Date().toLocaleTimeString())

    if (integracaoMessage) {
      ProcessReturnMessage(msg, tenantId);
      return;
    }
    const contact = await getCachedContact(chat, tenantId, whatsapp.id);
    if (!contact) {
      logger.error(
        `[whatsapp] Falha ao obter ou criar contato para ${chat.id._serialized}. Abortando.`
      );
      return;
    }

    let authorGrupMessage: any = "";

    if (msg.isGroupMsg) {
      const number = await GetContactByLid(msg.author, wbot);
      authorGrupMessage = number;
    }

    const { ticket, isNew } = await findOrCreateTicketSafe({
      contact,
      whatsappId: wbot.id,
      unreadMessages: chat.unreadCount,
      tenantId,
      groupContact: chat.isGroup,
      msg,
      channel: "whatsapp",
    });
    if (!ticket) {
      logger.error("[whatsapp] Falha crítica ao criar ou obter ticket.");
      return;
    }
    if (msg.filehash) {
      await VerifyMediaMessage(msg, ticket, contact, wbot, authorGrupMessage);
    } else {
      await VerifyMessage(msg, ticket, contact, authorGrupMessage);
    }

    if (isNew) {
      // Se o ticket foi criado AGORA, executa o flow. Apenas UM processo receberá isNew = true.
      logger.info(
        `[whatsapp] Ticket ${ticket.id} é novo. Iniciando ChatFlow de boas-vindas.`
      );
      await VerifyStepsChatFlowTicket(msg, ticket);
      await ticket.update({ chatFlowStatus: "waiting_answer" });
    } else if (ticket.chatFlowStatus === "waiting_answer") {
      logger.info(
        `[WhatsApp] Ticket ${ticket.id} está aguardando resposta. Processando...`
      );
      const chatFlow = await ticket.getChatFlow();
      const step = chatFlow?.flow.nodeList.find(
        (node: any) => node.id === ticket.stepChatFlow
      );
      if (step) {
        if (isValidFlowAnswer(msg, step)) {
          // A RESPOSTA É VÁLIDA! Agora sim, processamos o fluxo.
          logger.info(
            `[whatsapp] Ticket ${ticket.id}: Resposta inicial válida. Processando passo.`
          );
          await VerifyStepsChatFlowTicket(msg, ticket);
          // E finalmente, mudamos o estado para o fluxo normal.
          await ticket.update({ chatFlowStatus: "in_progress" });
        } else {
          logger.warn(
            `[whatsapp] Ticket ${ticket.id}: Resposta inválida recebida no estado 'waiting_answer'. Ignorando e notificando.`
          );
          const flowConfig = chatFlow.flow.nodeList.find(
            (node: any) => node.type === "configurations"
          );
          if (await isRetriesLimit(ticket, flowConfig)) return;

          const defaultMessage =
            "Por favor, escolha uma das opções do menu para continuar.";
          const messageBody =
            flowConfig?.data?.notOptionsSelectMessage?.message ||
            defaultMessage;
          await sendBotMessage(ticket.tenantId, ticket, messageBody); // Usando a função auxiliar que você já tem.
          await ticket.update({ botRetries: ticket.botRetries + 1 });
        }
      }
    } else if (ticket.chatFlowStatus === "in_progress") {
      logger.info(
        `[Telegram] Ticket ${ticket.id} em atendimento normal. Verificando passos.`
      );
      await VerifyStepsChatFlowTicket(msg, ticket);
    }

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
  } catch (error) {
    logger.error("Erro fatal no HandleMessage:", error);
  }
};
