import { Telegraf } from "telegraf";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import VerifyContact from "./TelegramVerifyContact";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import VerifyMediaMessage from "./TelegramVerifyMediaMessage";
import VerifyMessage from "./TelegramVerifyMessage";
import VerifyStepsChatFlowTicket from "../ChatFlowServices/VerifyStepsChatFlowTicket";
import { getCache, setCache } from "../../utils/cacheRedis";
import { RedisKeys } from "../../constants/redisKeys";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";

interface Session extends Telegraf {
  id: number;
}

// Caches em memória - AGORA POR USUÁRIO
const channelCache = new Map<number, Whatsapp>(); // WhatsApp ID -> Channel
const botInstanceCache = new Map<number, any>(); // Bot ID -> Bot Instance

// NOVO: Cache de contatos POR USUÁRIO E POR CHANNEL
const contactCache = new Map<string, any>(); // Key: `${whatsappId}_${userId}` -> Contact

// TTL para caches (30 minutos)
const CACHE_TTL = 5 * 60 * 1000;
const cacheTimestamps = new Map<string, number>();

// Função para verificar e limpar caches expirados
const cleanupExpiredCache = () => {
  const now = Date.now();
  for (const [key, timestamp] of cacheTimestamps) {
    if (now - timestamp > CACHE_TTL) {
      if (key.startsWith("channel_")) {
        channelCache.delete(Number(key.replace("channel_", "")));
      } else if (key.startsWith("bot_")) {
        botInstanceCache.delete(Number(key.replace("bot_", "")));
      } else if (key.startsWith("contact_")) {
        contactCache.delete(key);
      }
      cacheTimestamps.delete(key);
    }
  }
};

// Executar limpeza a cada 2 minutos
setInterval(cleanupExpiredCache, 2 * 60 * 1000);

const getCachedChannel = async (whatsappId: number): Promise<Whatsapp> => {
  // Limpar caches expirados ocasionalmente (10% das vezes)
  if (Math.random() < 0.1) {
    cleanupExpiredCache();
  }

  let channel = channelCache.get(whatsappId);

  if (!channel) {
    channel = (await getCache(RedisKeys.canalService(whatsappId))) as Whatsapp;

    if (!channel) {
      channel = await ShowWhatsAppService({ id: whatsappId });
      await setCache(RedisKeys.canalService(whatsappId), channel);
    }

    channelCache.set(whatsappId, channel);
    cacheTimestamps.set(`channel_${whatsappId}`, Date.now());
  }

  return channel;
};

const getCachedBotInstance = async (ctx: any): Promise<any> => {
  const botId = ctx?.botInfo?.id || ctx?.me?.id;

  if (!botId) {
    return await ctx.telegram.getMe();
  }

  let botInstance = botInstanceCache.get(botId);

  if (!botInstance) {
    botInstance = await ctx.telegram.getMe();
    botInstanceCache.set(botId, botInstance);
    cacheTimestamps.set(`bot_${botId}`, Date.now());
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

  if (!userId) {
    return await VerifyContact(ctx, tenantId);
  }

  // CHAVE ÚNICA: WhatsApp ID + User ID
  const contactKey = `contact_${whatsappId}_${userId}`;
  let contact = contactCache.get(contactKey);

  if (!contact) {
    contact = await VerifyContact(ctx, tenantId);
    contactCache.set(contactKey, contact);
    cacheTimestamps.set(contactKey, Date.now());
  }

  return contact;
};

const HandleMessage = async (ctx: any, tbot: Session): Promise<void> => {
  try {
    // 1. Cache do Canal (WhatsApp)
    const channel = await getCachedChannel(tbot.id);

    let message;
    let updateMessage: any = {};

    message = ctx?.message || ctx.update.callback_query?.message;
    updateMessage = ctx?.update;

    // Verificar se mensagem foi editada
    if (!message && updateMessage) {
      message = updateMessage?.edited_message;
    }

    const chat = message?.chat;

    // 2. Cache da instância do bot
    const me = await getCachedBotInstance(ctx);
    const fromMe =
      me.id ===
      (ctx.message?.from?.id ||
        ctx.update?.callback_query?.from?.id ||
        ctx.update?.edited_message?.from?.id);

    const messageData = {
      ...message,
      timestamp: +message.date * 1000,
    };

    // 3. Cache do Contato - AGORA COM whatsappId na chave
    let contact = await getCachedContact(ctx, channel.tenantId, tbot.id);

    const ticket = await FindOrCreateTicketService({
      contact,
      whatsappId: tbot.id!,
      unreadMessages: fromMe ? 0 : 1,
      tenantId: channel.tenantId,
      msg: { ...messageData, fromMe },
      channel: "telegram",
    });

    if (ticket?.isFarewellMessage) {
      return;
    }

    // Processar mensagem
    if (!messageData?.text && chat?.id) {
      await VerifyMediaMessage(ctx, fromMe, ticket, contact);
    } else {
      await VerifyMessage(ctx, fromMe, ticket, contact);
    }

    await VerifyStepsChatFlowTicket(
      {
        fromMe,
        body: message.reply_markup
          ? ctx.update.callback_query?.data
          : message.text,
        type: "reply_markup",
      },
      ticket
    );
  } catch (error) {
    logger.error("Error in HandleMessage:", error);
    // Em caso de erro, limpar caches para forçar recarregamento
    channelCache.delete(tbot.id);
    throw error;
  }
};

// Funções para invalidar caches quando necessário
export const invalidateChannelCache = (whatsappId: number) => {
  channelCache.delete(whatsappId);
  cacheTimestamps.delete(`channel_${whatsappId}`);
};

export const invalidateContactCache = (whatsappId: number, userId: number) => {
  const contactKey = `contact_${whatsappId}_${userId}`;
  contactCache.delete(contactKey);
  cacheTimestamps.delete(contactKey);
};

export const invalidateBotCache = (botId: number) => {
  botInstanceCache.delete(botId);
  cacheTimestamps.delete(`bot_${botId}`);
};

// Nova função: limpar todos os caches de um usuário específico
export const invalidateUserCaches = (whatsappId: number, userId: number) => {
  invalidateContactCache(whatsappId, userId);
};

export default HandleMessage;
