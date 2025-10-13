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
import {
  activeTicketsCache,
  channelCache,
  chatFlowInitiationLocks,
  cleanupExpiredCache,
  contactCache,
  getCachedBotInstance,
  getCachedChannel,
  ticketCreationLocks,
} from "../../utils/cacheLocal";

interface Session extends Telegraf {
  id: number;
}

const cacheTimestamps = new Map<string, number>();

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

// FUNÇÃO MELHORADA: Buscar ou criar ticket com prevenção de duplicação E verificação de status
const findOrCreateTicketSafe = async (params: {
  contact: any;
  whatsappId: number;
  unreadMessages: number;
  tenantId: number;
  msg: any;
  channel: string;
}): Promise<any> => {
  const { contact, whatsappId } = params;

  // Chave única para identificar sessão ativa
  const ticketKey = `ticket_${whatsappId}_${contact.id}`;

  // PRIMEIRO: Verificar se já existe ticket ativo no cache
  const cachedTicket = activeTicketsCache.get(ticketKey);

  if (cachedTicket) {
    try {
      // Buscar ticket do banco para verificar status atual
      const existingTicket = await Ticket.findByPk(cachedTicket.ticketId, {
        include: commonIncludes,
      });

      if (existingTicket) {
        // Verificar se o ticket está FECHADO
        if (existingTicket.status === "closed" || existingTicket.closedAt) {
          logger.info(
            `[Telegram] Ticket ${cachedTicket.ticketId} está FECHADO, removendo do cache e criando novo`
          );
          // Remover do cache pois está fechado
          activeTicketsCache.delete(ticketKey);
          // Continuar para criar novo ticket
        } else {
          logger.info(
            `[Telegram] Usando ticket existente do cache: ${cachedTicket.ticketId} - Status: ${existingTicket.status}`
          );
          return existingTicket;
        }
      } else {
        // Ticket não existe mais no banco, remover do cache
        logger.info(
          `[Telegram] Ticket ${cachedTicket.ticketId} não encontrado no banco, removendo do cache`
        );
        activeTicketsCache.delete(ticketKey);
      }
    } catch (error) {
      logger.error(`[Telegram] Erro ao verificar ticket do cache: ${error}`);
      // Em caso de erro, remover do cache e continuar
      activeTicketsCache.delete(ticketKey);
    }
  }

  // SEGUNDO: Verificar se já existe uma CRIAÇÃO em andamento
  if (ticketCreationLocks.has(ticketKey)) {
    logger.info(
      `[Telegram] Aguardando criação de ticket em andamento para ${ticketKey}`
    );
    const existingTicket = await ticketCreationLocks.get(ticketKey);

    // Se conseguimos o ticket do lock existente, verificar status
    if (existingTicket) {
      // Verificar se o ticket retornado não está fechado
      if (existingTicket.status !== "closed" && !existingTicket.isClosed) {
        return existingTicket;
      } else {
        logger.info(
          `[Telegram] Ticket do lock está FECHADO, ignorando e criando novo`
        );
        // Remover o lock pois o ticket está fechado
        ticketCreationLocks.delete(ticketKey);
      }
    }
  }

  // TERCEIRO: Criar NOVO ticket (com lock apenas na criação)
  const ticketPromise = (async () => {
    try {
      // Double-check: verificar cache novamente antes de criar
      const recheckCachedTicket = activeTicketsCache.get(ticketKey);
      if (recheckCachedTicket) {
        try {
          const recheckTicket = await Ticket.findByPk(
            recheckCachedTicket.ticketId,
            {
              include: commonIncludes,
            }
          );

          if (
            recheckTicket &&
            recheckTicket.status !== "closed" &&
            !recheckTicket.closedAt
          ) {
            return recheckTicket;
          } else {
            // Ticket está fechado, remover do cache
            activeTicketsCache.delete(ticketKey);
          }
        } catch (error) {
          logger.error(`[Telegram] Erro ao re-verificar ticket: ${error}`);
          activeTicketsCache.delete(ticketKey);
        }
      }

      // AGORA SIM: Criar o ticket (esta é a única parte com lock)
      const ticket = await FindOrCreateTicketService(params);

      if (ticket && ticket.id) {
        // Verificar se o ticket criado não está fechado antes de armazenar no cache
        if (ticket.status !== "closed" && !ticket.isClosed) {
          // Armazenar no cache de tickets ativos apenas se NÃO estiver fechado
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

      return ticket;
    } catch (error) {
      logger.error(`[Telegram] Erro ao criar ticket: ${error}`);
      throw error;
    }
  })();

  // COLOCAR LOCK APENAS DURANTE A CRIAÇÃO
  ticketCreationLocks.set(ticketKey, ticketPromise);

  try {
    const result = await ticketPromise;
    return result;
  } finally {
    // IMPORTANTE: Remover o lock IMEDIATAMENTE após a criação
    // Isso permite que outras mensagens usem o ticket livremente
    ticketCreationLocks.delete(ticketKey);
  }
};
const HandleMessage = async (ctx: any, tbot: Session): Promise<void> => {
  let ticketIdForLock: number | null = null;

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
    const ticket = await findOrCreateTicketSafe({
      contact,
      whatsappId: tbot.id!,
      unreadMessages: fromMe ? 0 : 1,
      tenantId: channel.tenantId,
      msg: { ...messageData, fromMe },
      channel: "telegram",
    });

    if (!ticket) {
      logger.error("[Telegram] Falha ao criar/obter ticket");
      return;
    }
    if (ticket.chatFlowId) {
      ticketIdForLock = ticket.id;
    }
    if (ticket?.isFarewellMessage) {
      return;
    }

    // Processar mensagem
    if (!messageData?.text && chat?.id) {
      await VerifyMediaMessage(ctx, fromMe, ticket, contact);
    } else {
      await VerifyMessage(ctx, fromMe, ticket, contact);
    }

    if (ticket.sendWelcomeFlow && !chatFlowInitiationLocks.has(ticket.id)) {
      chatFlowInitiationLocks.add(ticket.id);
      logger.info(
        `[Telegram] Ticket ${ticket.id} tem permissão para iniciar o ChatFlow. Executando...`
      );
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
      await ticket.update({ sendWelcomeFlow: false });
      logger.info(
        `[Telegram] Permissão 'sendWelcomeFlow' para o ticket ${ticket.id} foi desativada.`
      );
    } else if (!ticket.sendWelcomeFlow && ticket.chatFlowId) {
      logger.info(
        `[Telegram] Ticket ${ticket.id} em atendimento normal. Verificando passos do ChatFlow.`
      );

      // Aqui, o VerifyStepsChatFlowTicket é chamado sem a proteção do lock,
      // permitindo que ele seja executado em todas as mensagens subsequentes.
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
  } finally {
    if (ticketIdForLock) {
      chatFlowInitiationLocks.delete(ticketIdForLock);
      logger.info(
        `[Telegram] Lock de iniciação do ChatFlow liberado para o ticket ${ticketIdForLock}.`
      );
    }
  }
};

export default HandleMessage;
