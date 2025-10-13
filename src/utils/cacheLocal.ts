import { RedisKeys } from "../constants/redisKeys";
import Whatsapp from "../models/Whatsapp";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { getCache, setCache } from "./cacheRedis";

const TICKET_CACHE_TTL = 10 * 60 * 1000; // 10 minutos para ticket cache
const CACHE_TTL = 1 * 60 * 1000;

// Lock APENAS para criação de tickets (não para processamento)
export const ticketCreationLocks = new Map<string, Promise<any>>();
// Armazena os IDs dos tickets que estão atualmente executando o flow pela primeira vez.
export const chatFlowInitiationLocks = new Set<number>();
// NOVO: Cache de tickets ativos por usuário
export const activeTicketsCache = new Map<
  string,
  { ticketId: number; timestamp: number }
>();
// Caches em memória - AGORA POR USUÁRIO
export const channelCache = new Map<number, Whatsapp>(); // WhatsApp ID -> Channel
export const botInstanceCache = new Map<number, any>(); // Bot ID -> Bot Instance
// NOVO: Cache de contatos POR USUÁRIO E POR CHANNEL
export const contactCache = new Map<string, any>(); // Key: `${whatsappId}_${userId}` -> Contact
export const cacheTimestamps = new Map<string, number>();

export const cleanupExpiredCache = () => {
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

  for (const [key, ticketInfo] of activeTicketsCache) {
    if (now - ticketInfo.timestamp > TICKET_CACHE_TTL) {
      activeTicketsCache.delete(key);
    }
  }
  logCacheSizes();
};

export const getCachedChannel = async (
  whatsappId: number
): Promise<Whatsapp> => {
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

export const getCachedBotInstance = async (ctx: any): Promise<any> => {
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
const logCacheSizes = () => {
  const now = new Date().toISOString();

  console.log(`--- Cache Status at ${now} ---`);

  // Caches principais
  console.log(`[Monitor] channelCache size: ${channelCache.size}`);
  console.log(`[Monitor] botInstanceCache size: ${botInstanceCache.size}`);
  console.log(`[Monitor] contactCache size: ${contactCache.size}`);

  // Caches de controle de fluxo e locks
  console.log(`[Monitor] activeTicketsCache size: ${activeTicketsCache.size}`);
  console.log(
    `[Monitor] ticketCreationLocks size: ${ticketCreationLocks.size}`
  ); // Importante monitorar locks!
  console.log(
    `[Monitor] chatFlowInitiationLocks size: ${chatFlowInitiationLocks.size}`
  ); // E o novo lock também.

  console.log(`------------------------------------`);
};

setInterval(cleanupExpiredCache, 2 * 60 * 1000);
