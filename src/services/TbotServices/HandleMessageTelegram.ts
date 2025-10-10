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
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import User from "../../models/User";

interface Session extends Telegraf {
  id: number;
}

// NOVO: Cache de tickets ativos por usuário
const activeTicketsCache = new Map<
  string,
  { ticketId: number; timestamp: number }
>();

const TICKET_CACHE_TTL = 10 * 60 * 1000; // 10 minutos para ticket cache

// Caches em memória - AGORA POR USUÁRIO
const channelCache = new Map<number, Whatsapp>(); // WhatsApp ID -> Channel
const botInstanceCache = new Map<number, any>(); // Bot ID -> Bot Instance

// NOVO: Cache de contatos POR USUÁRIO E POR CHANNEL
const contactCache = new Map<string, any>(); // Key: `${whatsappId}_${userId}` -> Contact

// TTL para caches (30 minutos)
const CACHE_TTL = 5 * 60 * 1000;
const cacheTimestamps = new Map<string, number>();

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

  const commonIncludes = [
      {
        model: Contact,
        as: "contact",
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name"],
      },
      {
        association: "whatsapp",
        attributes: ["id", "name"],
      },
    ];

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

// Lock APENAS para criação de tickets (não para processamento)
const ticketCreationLocks = new Map<string, Promise<any>>();

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

  for (const [key, ticketInfo] of activeTicketsCache) {
    if (now - ticketInfo.timestamp > TICKET_CACHE_TTL) {
      activeTicketsCache.delete(key);
    }
  }
};

setInterval(cleanupExpiredCache, 2 * 60 * 1000);

// FUNÇÃO MELHORADA: Buscar ou criar ticket com prevenção de duplicação
const findOrCreateTicketSafe = async (params: {
  contact: any;
  whatsappId: number;
  unreadMessages: number;
  tenantId: number;
  msg: any;
  channel: string;
}): Promise<any> => {
  const { contact, whatsappId, tenantId } = params;

  const ticketKey = `ticket_${whatsappId}_${contact.id}`;

  // PRIMEIRO: Verificar se já existe ticket ativo no cache
  const cachedTicket = activeTicketsCache.get(ticketKey);
  if (cachedTicket) {
    try {
      const existingTicket = await Ticket.findByPk(cachedTicket.ticketId, { 
        include: commonIncludes 
      });

      if (existingTicket) {
        if (existingTicket.status === "closed" || existingTicket.closedAt) {
          logger.info(
            `[Telegram] Ticket ${cachedTicket.ticketId} está FECHADO, removendo do cache e criando novo`
          );
          activeTicketsCache.delete(ticketKey);
        } else {
          logger.info(
            `[Telegram] Usando ticket existente do cache: ${cachedTicket.ticketId} - Status: ${existingTicket.status}`
          );
          return { 
            ticket: existingTicket, 
            shouldRunFlow: existingTicket.sendWelcomeFlow // ✅ Verificar se precisa rodar o fluxo
          };
        }
      } else {
        logger.info(
          `[Telegram] Ticket ${cachedTicket.ticketId} não encontrado no banco, removendo do cache`
        );
        activeTicketsCache.delete(ticketKey);
      }
    } catch (error) {
      logger.error(`[Telegram] Erro ao verificar ticket do cache: ${error}`);
      activeTicketsCache.delete(ticketKey);
    }
  }

  // SEGUNDO: Verificar se já existe uma CRIAÇÃO em andamento
  if (ticketCreationLocks.has(ticketKey)) {
    logger.info(
      `[Telegram] Aguardando criação de ticket em andamento para ${ticketKey}`
    );
    const existingTicket = await ticketCreationLocks.get(ticketKey);

    if (existingTicket) {
      if (existingTicket.status !== "closed" && !existingTicket.isClosed) {
        return { 
          ticket: existingTicket, 
          shouldRunFlow: existingTicket.sendWelcomeFlow // ✅ Verificar se precisa rodar o fluxo
        };
      } else {
        logger.info(
          `[Telegram] Ticket do lock está FECHADO, ignorando e criando novo`
        );
        ticketCreationLocks.delete(ticketKey);
      }
    }
  }

  // TERCEIRO: Criar NOVO ticket
  const ticketPromise = (async () => {
    try {
      // Double-check: verificar cache novamente antes de criar
      const recheckCachedTicket = activeTicketsCache.get(ticketKey);
      if (recheckCachedTicket) {
        try {
          const recheckTicket = await Ticket.findByPk(recheckCachedTicket.ticketId, { 
            include: commonIncludes 
          });
          
          if (recheckTicket && recheckTicket.status !== "closed" && !recheckTicket.closedAt) {
            return { 
              ticket: recheckTicket, 
              shouldRunFlow: recheckTicket.sendWelcomeFlow // ✅ Verificar se precisa rodar o fluxo
            };
          } else {
            activeTicketsCache.delete(ticketKey);
          }
        } catch (error) {
          logger.error(`[Telegram] Erro ao re-verificar ticket: ${error}`);
          activeTicketsCache.delete(ticketKey);
        }
      }

      // AGORA SIM: Criar o ticket
      const ticket = await FindOrCreateTicketService(params);

      if (ticket && ticket.id) {
        if (ticket.status !== "closed" && !ticket.isClosed) {
          activeTicketsCache.set(ticketKey, {
            ticketId: ticket.id,
            timestamp: Date.now(),
          });

          logger.info(
            `[Telegram] Novo ticket criado: ${ticket.id} para ${ticketKey} - Status: ${ticket.status}`
          );
        } else {
          logger.info(
            `[Telegram] Ticket criado mas está FECHADO, não armazenando no cache: ${ticket.id}`
          );
        }
      }

      return { 
        ticket, 
        shouldRunFlow: ticket.sendWelcomeFlow // ✅ Novo ticket geralmente precisa rodar o fluxo
      };
    } catch (error) {
      logger.error(`[Telegram] Erro ao criar ticket: ${error}`);
      throw error;
    }
  })();

  ticketCreationLocks.set(ticketKey, ticketPromise);

  try {
    const result = await ticketPromise;
    return result;
  } finally {
    ticketCreationLocks.delete(ticketKey);
  }
};

const HandleMessage = async (ctx: any, tbot: Session): Promise<void> => {
  try {
    const channel = await getCachedChannel(tbot.id);

    let message = ctx?.message || ctx.update.callback_query?.message;
    let updateMessage: any = ctx?.update;

    if (!message && updateMessage) {
      message = updateMessage?.edited_message;
    }

    const chat = message?.chat;

    const me = await getCachedBotInstance(ctx);
    const fromMe =
      me.id ===
      (ctx.message?.from?.id ||
        ctx.update?.callback_query?.from?.id ||
        ctx.update?.edited_message?.from?.id);

    const userId =
      ctx.message?.from?.id ||
      ctx.update?.callback_query?.from?.id ||
      ctx.update?.edited_message?.from?.id;

    const messageData = {
      ...message,
      timestamp: +message.date * 1000,
    };

    let contact = await getCachedContact(ctx, channel.tenantId, tbot.id);

    // ✅ Buscar/Criar ticket
    const ticketResult = await findOrCreateTicketSafe({
      contact,
      whatsappId: tbot.id!,
      unreadMessages: fromMe ? 0 : 1,
      tenantId: channel.tenantId,
      msg: { ...messageData, fromMe },
      channel: "telegram",
    });

    const ticket = ticketResult.ticket as Ticket;
    const shouldRunFlow = ticketResult.shouldRunFlow as boolean;
    console.log(ticket)
    if (!ticket) {
      logger.error("[Telegram] Falha ao criar/obter ticket");
      return;
    }

    if (ticket?.isFarewellMessage) {
      return;
    }

    logger.info(`[Telegram] Processando mensagem no ticket: ${ticket.id} - sendWelcomeFlow: ${ticket.sendWelcomeFlow}`);

    // Processar mensagem
    if (!messageData?.text && chat?.id) {
      await VerifyMediaMessage(ctx, fromMe, ticket, contact);
    } else {
      await VerifyMessage(ctx, fromMe, ticket, contact);
    }

    // ✅ EXECUTAR VerifyStepsChatFlowTicket APENAS SE sendWelcomeFlow for true
    if (!shouldRunFlow) {
      logger.info(`[Telegram] Executando VerifyStepsChatFlowTicket para ticket: ${ticket.id} (sendWelcomeFlow: true)`);
      
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

      // ✅ IMPORTANTE: Após executar o fluxo, atualizar o ticket para não rodar novamente
      // (isso deve ser feito dentro do VerifyStepsChatFlowTicket ou aqui)
      // await ticket.update({ sendWelcomeFlow: false });
      
    } else {
      logger.info(`[Telegram] Pulando VerifyStepsChatFlowTicket para ticket: ${ticket.id} (sendWelcomeFlow: false)`);
    }

    // Atualizar timestamp do ticket no cache
    const ticketKey = `ticket_${tbot.id}_${contact.id}`;
    if (activeTicketsCache.has(ticketKey)) {
      activeTicketsCache.set(ticketKey, {
        ticketId: ticket.id,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    logger.error("Error in HandleMessage:", error);
    channelCache.delete(tbot.id);
    throw error;
  }
};

// Função para verificar se um ticket existe no cache
export const getActiveTicket = (whatsappId: number, contactId: number) => {
  const ticketKey = `ticket_${whatsappId}_${contactId}`;
  return activeTicketsCache.get(ticketKey);
};

// Função para forçar a atualização do cache de ticket
export const updateTicketCache = (
  whatsappId: number,
  contactId: number,
  ticketId: number
) => {
  const ticketKey = `ticket_${whatsappId}_${contactId}`;
  activeTicketsCache.set(ticketKey, {
    ticketId,
    timestamp: Date.now(),
  });
};

// Fechar ticket (remover do cache)
export const closeTicketInCache = (whatsappId: number, contactId: number) => {
  const ticketKey = `ticket_${whatsappId}_${contactId}`;
  activeTicketsCache.delete(ticketKey);
  logger.info(`[Telegram] Ticket removido do cache: ${ticketKey}`);
};

// Limpar todos os tickets de um usuário
export const clearUserTickets = (whatsappId: number, contactId: number) => {
  const ticketKey = `ticket_${whatsappId}_${contactId}`;
  activeTicketsCache.delete(ticketKey);
  ticketCreationLocks.delete(ticketKey);
};

// Funções existentes de invalidate...
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

export const invalidateUserCaches = (whatsappId: number, userId: number) => {
  invalidateContactCache(whatsappId, userId);
  clearUserTickets(whatsappId, userId);
};

export default HandleMessage;

// import { Telegraf } from "telegraf";
// import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
// import VerifyContact from "./TelegramVerifyContact";
// import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
// import VerifyMediaMessage from "./TelegramVerifyMediaMessage";
// import VerifyMessage from "./TelegramVerifyMessage";
// import VerifyStepsChatFlowTicket from "../ChatFlowServices/VerifyStepsChatFlowTicket";
// import { getCache, setCache } from "../../utils/cacheRedis";
// import { RedisKeys } from "../../constants/redisKeys";
// import Whatsapp from "../../models/Whatsapp";
// import { logger } from "../../utils/logger";

// interface Session extends Telegraf {
//   id: number;
// }

// // Caches em memória - AGORA POR USUÁRIO
// const channelCache = new Map<number, Whatsapp>(); // WhatsApp ID -> Channel
// const botInstanceCache = new Map<number, any>(); // Bot ID -> Bot Instance

// // NOVO: Cache de contatos POR USUÁRIO E POR CHANNEL
// const contactCache = new Map<string, any>(); // Key: `${whatsappId}_${userId}` -> Contact

// // TTL para caches (30 minutos)
// const CACHE_TTL = 5 * 60 * 1000;
// const cacheTimestamps = new Map<string, number>();

// // Função para verificar e limpar caches expirados
// const cleanupExpiredCache = () => {
//   const now = Date.now();
//   for (const [key, timestamp] of cacheTimestamps) {
//     if (now - timestamp > CACHE_TTL) {
//       if (key.startsWith("channel_")) {
//         channelCache.delete(Number(key.replace("channel_", "")));
//       } else if (key.startsWith("bot_")) {
//         botInstanceCache.delete(Number(key.replace("bot_", "")));
//       } else if (key.startsWith("contact_")) {
//         contactCache.delete(key);
//       }
//       cacheTimestamps.delete(key);
//     }
//   }
// };

// // Executar limpeza a cada 2 minutos
// setInterval(cleanupExpiredCache, 2 * 60 * 1000);

// const getCachedChannel = async (whatsappId: number): Promise<Whatsapp> => {
//   // Limpar caches expirados ocasionalmente (10% das vezes)
//   if (Math.random() < 0.1) {
//     cleanupExpiredCache();
//   }

//   let channel = channelCache.get(whatsappId);

//   if (!channel) {
//     channel = (await getCache(RedisKeys.canalService(whatsappId))) as Whatsapp;

//     if (!channel) {
//       channel = await ShowWhatsAppService({ id: whatsappId });
//       await setCache(RedisKeys.canalService(whatsappId), channel);
//     }

//     channelCache.set(whatsappId, channel);
//     cacheTimestamps.set(`channel_${whatsappId}`, Date.now());
//   }

//   return channel;
// };

// const getCachedBotInstance = async (ctx: any): Promise<any> => {
//   const botId = ctx?.botInfo?.id || ctx?.me?.id;

//   if (!botId) {
//     return await ctx.telegram.getMe();
//   }

//   let botInstance = botInstanceCache.get(botId);

//   if (!botInstance) {
//     botInstance = await ctx.telegram.getMe();
//     botInstanceCache.set(botId, botInstance);
//     cacheTimestamps.set(`bot_${botId}`, Date.now());
//   }

//   return botInstance;
// };

// const getCachedContact = async (
//   ctx: any,
//   tenantId: number,
//   whatsappId: number
// ): Promise<any> => {
//   const userId =
//     ctx.message?.from?.id ||
//     ctx.update?.callback_query?.from?.id ||
//     ctx.update?.edited_message?.from?.id;

//   if (!userId) {
//     return await VerifyContact(ctx, tenantId);
//   }

//   // CHAVE ÚNICA: WhatsApp ID + User ID
//   const contactKey = `contact_${whatsappId}_${userId}`;
//   let contact = contactCache.get(contactKey);

//   if (!contact) {
//     contact = await VerifyContact(ctx, tenantId);
//     contactCache.set(contactKey, contact);
//     cacheTimestamps.set(contactKey, Date.now());
//   }

//   return contact;
// };

// const HandleMessage = async (ctx: any, tbot: Session): Promise<void> => {
//   try {
//     // 1. Cache do Canal (WhatsApp)
//     const channel = await getCachedChannel(tbot.id);

//     let message;
//     let updateMessage: any = {};

//     message = ctx?.message || ctx.update.callback_query?.message;
//     updateMessage = ctx?.update;

//     // Verificar se mensagem foi editada
//     if (!message && updateMessage) {
//       message = updateMessage?.edited_message;
//     }

//     const chat = message?.chat;

//     // 2. Cache da instância do bot
//     const me = await getCachedBotInstance(ctx);
//     const fromMe =
//       me.id ===
//       (ctx.message?.from?.id ||
//         ctx.update?.callback_query?.from?.id ||
//         ctx.update?.edited_message?.from?.id);

//     const messageData = {
//       ...message,
//       timestamp: +message.date * 1000,
//     };

//     // 3. Cache do Contato - AGORA COM whatsappId na chave
//     let contact = await getCachedContact(ctx, channel.tenantId, tbot.id);

//     const ticket = await FindOrCreateTicketService({
//       contact,
//       whatsappId: tbot.id!,
//       unreadMessages: fromMe ? 0 : 1,
//       tenantId: channel.tenantId,
//       msg: { ...messageData, fromMe },
//       channel: "telegram",
//     });

//     if (ticket?.isFarewellMessage) {
//       return;
//     }

//     // Processar mensagem
//     if (!messageData?.text && chat?.id) {
//       await VerifyMediaMessage(ctx, fromMe, ticket, contact);
//     } else {
//       await VerifyMessage(ctx, fromMe, ticket, contact);
//     }

//     await VerifyStepsChatFlowTicket(
//       {
//         fromMe,
//         body: message.reply_markup
//           ? ctx.update.callback_query?.data
//           : message.text,
//         type: "reply_markup",
//       },
//       ticket
//     );
//   } catch (error) {
//     logger.error("Error in HandleMessage:", error);
//     // Em caso de erro, limpar caches para forçar recarregamento
//     channelCache.delete(tbot.id);
//     throw error;
//   }
// };

// // Funções para invalidar caches quando necessário
// export const invalidateChannelCache = (whatsappId: number) => {
//   channelCache.delete(whatsappId);
//   cacheTimestamps.delete(`channel_${whatsappId}`);
// };

// export const invalidateContactCache = (whatsappId: number, userId: number) => {
//   const contactKey = `contact_${whatsappId}_${userId}`;
//   contactCache.delete(contactKey);
//   cacheTimestamps.delete(contactKey);
// };

// export const invalidateBotCache = (botId: number) => {
//   botInstanceCache.delete(botId);
//   cacheTimestamps.delete(`bot_${botId}`);
// };

// // Nova função: limpar todos os caches de um usuário específico
// export const invalidateUserCaches = (whatsappId: number, userId: number) => {
//   invalidateContactCache(whatsappId, userId);
// };

// export default HandleMessage;
