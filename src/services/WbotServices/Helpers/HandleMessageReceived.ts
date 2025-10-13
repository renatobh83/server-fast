import { Chat, Message, Whatsapp as wbot } from "wbotconnect";

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

interface Session extends wbot {
  id: number;
}

// Constantes para chaves Redis e TTLs
const REDIS_KEYS = {
  channel: (id: number) => `cache:channel:${id}`,
  botInstance: (id: number) => `cache:bot:${id}`,
  contact: (whatsappId: number, userId: number) =>
    `cache:contact:${whatsappId}:${userId}`,
  ticketLock: (whatsappId: number, contactId: number) =>
    `lock:ticket:${whatsappId}:${contactId}`,
};
const TTL = {
  CACHE: 5 * 60, // 5 minutos para caches gerais
  LOCK: 15, // 15 segundos para um lock de criação de ticket
};

const commonIncludes = [
  { model: Contact, as: "contact" },
  { model: User, as: "user", attributes: ["id", "name"] },
  { association: "whatsapp", attributes: ["id", "name"] },
];

// ========================================================================
// FUNÇÕES DE CACHE REESCRITAS COM REDIS
// ========================================================================

const getCachedChannel = async (whatsappId: number): Promise<Whatsapp> => {
  const key = REDIS_KEYS.channel(whatsappId);
  const cached = await redisClient.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const channel = await ShowWhatsAppService({ id: whatsappId });
  if (channel) {
    await redisClient.set(key, JSON.stringify(channel), "EX", TTL.CACHE);
  }
  return channel;
};

const getCachedContact = async (
  chat: any,
  tenantId: number,
  whatsappId: number,
  contatoNumber: string
): Promise<any> => {
  const key = REDIS_KEYS.contact(whatsappId, +contatoNumber);
  const cached = await redisClient.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const contact = await VerifyContact(chat, tenantId);
  if (contact) {
    await redisClient.set(key, JSON.stringify(contact), "EX", TTL.CACHE);
  }
  return contact;
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
        where: { contactId: contact.id, whatsappId, status: "open" },
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
    await new Promise((resolve) => setTimeout(resolve, 500)); // Delay de 500ms

    // Busca o ticket que o outro processo DEVE ter criado
    const ticket = await Ticket.findOne({
      where: { contactId: contact.id, whatsappId, status: "pennding" },
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
  const whatsapp = await getCachedChannel(wbot.id);
  const { tenantId } = whatsapp;

  if (!isValidMsg(msg)) {
    return;
  }

  try {
    const chat: Chat = await wbot.getChatById(msg.from);

    let Settingdb: Setting;

    Settingdb = (await getCache(
      RedisKeys.settingsIgnoreGroupMsg(tenantId)
    )) as Setting;

    if (!Settingdb) {
      Settingdb = (await Setting.findOne({
        where: { key: "ignoreGroupMsg", tenantId },
      })) as Setting;
      await setCache(RedisKeys.settingsIgnoreGroupMsg(+tenantId), Settingdb);
    }

    if (
      Settingdb?.value === "enabled" &&
      (chat.isGroup || msg.from === "status@broadcast")
    ) {
      return;
    }

    const contact: Contact = await getCachedContact(
      chat,
      tenantId,
      whatsapp.id,
      chat.id._serialized
    );

    let authorGrupMessage: any = "";

    if (msg.isGroupMsg) {
      const number = await GetContactByLid(msg.author, wbot);
      authorGrupMessage = number;
    }

    const integracaoMessage = await IntegracaoGenesisConfirmacao.findOne({
      where: { contato: chat.id._serialized, closedAt: { [Op.is]: null } },
    });
    // console.log("integracaoMessage", new Date().toLocaleTimeString())

    if (integracaoMessage) {
      ProcessReturnMessage(msg, tenantId);
      return;
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
    } else {
      logger.info(
        `[WhatsApp] Ticket ${ticket.id} em atendimento normal. Verificando passos do ChatFlow.`
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
