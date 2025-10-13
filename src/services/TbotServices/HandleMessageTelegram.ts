import { Telegraf } from "telegraf";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import VerifyContact from "./TelegramVerifyContact";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import VerifyMediaMessage from "./TelegramVerifyMediaMessage";
import VerifyMessage from "./TelegramVerifyMessage";
import VerifyStepsChatFlowTicket from "../ChatFlowServices/VerifyStepsChatFlowTicket";
import { logger } from "../../utils/logger";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import { redisClient } from "../../lib/redis";

interface Session extends Telegraf {
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

const getCachedBotInstance = async (ctx: any): Promise<any> => {
  const botId = ctx?.botInfo?.id || ctx?.me?.id;
  if (!botId) return ctx.telegram.getMe();

  const key = REDIS_KEYS.botInstance(botId);
  const cached = await redisClient.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const botInstance = await ctx.telegram.getMe();
  if (botInstance) {
    await redisClient.set(key, JSON.stringify(botInstance), "EX", TTL.CACHE);
  }
  return botInstance;
};

const getCachedContact = async (
  ctx: any,
  tenantId: number,
  whatsappId: number
): Promise<any> => {
  const userId =
    ctx.message?.from?.id ||
    ctx.update?.callback_query?.from?.id ||
    ctx.update?.edited_message?.from?.id;
  if (!userId) return VerifyContact(ctx, tenantId);

  const key = REDIS_KEYS.contact(whatsappId, userId);
  const cached = await redisClient.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const contact = await VerifyContact(ctx, tenantId);
  if (contact) {
    await redisClient.set(key, JSON.stringify(contact), "EX", TTL.CACHE);
  }
  return contact;
};

// ========================================================================
// findOrCreateTicketSafe REESCRITO COM LOCK DISTRIBUÍDO (REDIS)
// ========================================================================

const findOrCreateTicketSafe = async (params: {
  contact: any;
  whatsappId: number;
  unreadMessages: number;
  tenantId: number;
  msg: any;
  channel: string;
}): Promise<{ ticket: any; isNew: boolean }> => {
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
    // === LOCK ADQUIRIDO: Somos o primeiro processo ===
    logger.info(
      `[Telegram] Lock adquirido para ${lockKey}. Procedendo com a criação.`
    );
    try {
      // Verifica se um ticket aberto já existe (pode ter sido criado em uma interação anterior)
      const existingTicket = await Ticket.findOne({
        where: { contactId: contact.id, whatsappId, status: "open" },
        include: commonIncludes,
      });

      if (existingTicket) {
        logger.info(
          `[Telegram] Ticket ${existingTicket.id} já existia. Usando-o.`
        );
        return { ticket: existingTicket, isNew: false };
      }

      // Se não existe, cria o novo ticket
      const newTicket = await FindOrCreateTicketService(params);
      logger.info(`[Telegram] Novo ticket ${newTicket.id} criado.`);
      return { ticket: newTicket, isNew: true };
    } catch (error) {
      logger.error(
        `[Telegram] Erro durante a criação do ticket (com lock): ${error}`
      );
      return { ticket: null, isNew: false };
    } finally {
      // Libera o lock para futuras operações
      await redisClient.del(lockKey);
      logger.info(`[Telegram] Lock liberado para ${lockKey}.`);
    }
  } else {
    // === LOCK NÃO ADQUIRIDO: Somos um processo seguidor ===
    logger.info(
      `[Telegram] Lock para ${lockKey} já existe. Aguardando ticket...`
    );
    // Espera um pouco para dar tempo ao primeiro processo de criar o ticket
    await new Promise((resolve) => setTimeout(resolve, 500)); // Delay de 500ms

    // Busca o ticket que o outro processo DEVE ter criado
    const ticket = await Ticket.findOne({
      where: { contactId: contact.id, whatsappId, status: "open" },
      order: [["createdAt", "DESC"]], // Pega o mais recente para garantir
      include: commonIncludes,
    });

    if (ticket) {
      logger.info(`[Telegram] Ticket ${ticket.id} encontrado após aguardar.`);
      return { ticket, isNew: false };
    } else {
      logger.error(
        `[Telegram] Aguardou pelo lock, mas o ticket não foi encontrado. Isso pode indicar uma falha na criação pelo processo líder.`
      );
      return { ticket: null, isNew: false };
    }
  }
};

// ========================================================================
// HANDLEMESSAGE PRINCIPAL (AGORA MAIS LIMPO)
// ========================================================================

const HandleMessage = async (ctx: any, tbot: Session): Promise<void> => {
  try {
    const channel = await getCachedChannel(tbot.id);
    if (!channel) {
      logger.error(`[Telegram] Canal ${tbot.id} não encontrado.`);
      return;
    }

    let message = ctx?.message || ctx.update.callback_query?.message;
    if (!message && ctx.update) {
      message = ctx.update.edited_message;
    }
    if (!message) {
      logger.warn(
        "[Telegram] Não foi possível extrair a mensagem do contexto.",
        ctx
      );
      return;
    }

    const chat = message.chat;
    const me = await getCachedBotInstance(ctx);
    const fromMe =
      me.id ===
      (ctx.message?.from?.id ||
        ctx.update?.callback_query?.from?.id ||
        ctx.update?.edited_message?.from?.id);
    const contact = await getCachedContact(ctx, channel.tenantId, tbot.id);
    const messageData = { ...message, timestamp: +message.date * 1000 };

    // A chamada para buscar/criar o ticket agora é atomicamente segura entre processos
    const { ticket, isNew } = await findOrCreateTicketSafe({
      contact,
      whatsappId: tbot.id!,
      unreadMessages: fromMe ? 0 : 1,
      tenantId: channel.tenantId,
      msg: { ...messageData, fromMe },
      channel: "telegram",
    });

    if (!ticket) {
      logger.error("[Telegram] Falha crítica ao criar ou obter ticket.");
      return;
    }

    if (ticket.isFarewellMessage) return;

    // Processamento da mensagem (mídia ou texto)
    if (!messageData.text && chat?.id) {
      await VerifyMediaMessage(ctx, fromMe, ticket, contact);
    } else {
      await VerifyMessage(ctx, fromMe, ticket, contact);
    }

    // Lógica de execução do ChatFlow
    const body = message.reply_markup
      ? ctx.update.callback_query?.data
      : message.text;

    if (isNew) {
      // Se o ticket foi criado AGORA, executa o flow. Apenas UM processo receberá isNew = true.
      logger.info(
        `[Telegram] Ticket ${ticket.id} é novo. Iniciando ChatFlow de boas-vindas.`
      );
      await VerifyStepsChatFlowTicket(
        { fromMe, body, type: "reply_markup" },
        ticket
      );
    } else {
      // Para todas as outras mensagens (concorrentes e futuras), executa o flow normalmente.
      logger.info(
        `[Telegram] Ticket ${ticket.id} já existente. Verificando passos normais do ChatFlow.`
      );
      await VerifyStepsChatFlowTicket(
        { fromMe, body, type: "reply_markup" },
        ticket
      );
    }
  } catch (error) {
    logger.error("Erro fatal no HandleMessage:", error);
  }
};

export default HandleMessage;
