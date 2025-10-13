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
import {
  activeTicketsCache,
  cacheTimestamps,
  channelCache,
  chatFlowInitiationLocks,
  contactCache,
  getCachedChannel,
  ticketCreationLocks,
} from "../../../utils/cacheLocal";
import { logger } from "../../../utils/logger";
import User from "../../../models/User";

interface Session extends wbot {
  id: number;
}
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
            `[WhatsApp] Ticket ${cachedTicket.ticketId} está FECHADO, removendo do cache e criando novo`
          );
          // Remover do cache pois está fechado
          activeTicketsCache.delete(ticketKey);
          // Continuar para criar novo ticket
        } else {
          logger.info(
            `[WhatsApp] Usando ticket existente do cache: ${cachedTicket.ticketId} - Status: ${existingTicket.status}`
          );
          return existingTicket;
        }
      } else {
        // Ticket não existe mais no banco, remover do cache
        logger.info(
          `[WhatsApp] Ticket ${cachedTicket.ticketId} não encontrado no banco, removendo do cache`
        );
        activeTicketsCache.delete(ticketKey);
      }
    } catch (error) {
      logger.error(`[WhatsApp] Erro ao verificar ticket do cache: ${error}`);
      // Em caso de erro, remover do cache e continuar
      activeTicketsCache.delete(ticketKey);
    }
  }

  // SEGUNDO: Verificar se já existe uma CRIAÇÃO em andamento
  if (ticketCreationLocks.has(ticketKey)) {
    logger.info(
      `[WhatsApp] Aguardando criação de ticket em andamento para ${ticketKey}`
    );
    const existingTicket = await ticketCreationLocks.get(ticketKey);

    // Se conseguimos o ticket do lock existente, verificar status
    if (existingTicket) {
      // Verificar se o ticket retornado não está fechado
      if (existingTicket.status !== "closed" && !existingTicket.isClosed) {
        return existingTicket;
      } else {
        logger.info(
          `[WhatsApp] Ticket do lock está FECHADO, ignorando e criando novo`
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
          logger.error(`[WhatsApp] Erro ao re-verificar ticket: ${error}`);
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
            `[WhatsApp] Novo ticket criado: ${ticket.id} para ${ticketKey} - Status: ${ticket.status}`
          );
        } else {
          logger.info(
            `[WhatsApp] Ticket criado mas está FECHADO, não armazenando no cache: ${ticket.id}`
          );
        }
      }

      return ticket;
    } catch (error) {
      logger.error(`[WhatsApp] Erro ao criar ticket: ${error}`);
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

const getCachedContact = async (
  chat: any,
  tenantId: number,
  whatsappId: number,
  contatoNumber: string
): Promise<any> => {
  // CHAVE ÚNICA: WhatsApp ID + User ID
  const contactKey = `contact_${whatsappId}_${contatoNumber}`;
  let contact = contactCache.get(contactKey);

  if (!contact) {
    contact = await VerifyContact(chat, tenantId);
    contactCache.set(contactKey, contact);
    cacheTimestamps.set(contactKey, Date.now());
  }

  return contact;
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
  let ticketIdForLock: number | null = null;
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

    const ticket = await findOrCreateTicketSafe({
      contact,
      whatsappId: wbot.id,
      unreadMessages: chat.unreadCount,
      tenantId,
      groupContact: chat.isGroup,
      msg,
      channel: "whatsapp",
    });

    if (msg.filehash) {
      await VerifyMediaMessage(msg, ticket, contact, wbot, authorGrupMessage);
    } else {
      await VerifyMessage(msg, ticket, contact, authorGrupMessage);
    }
    if (ticket.chatFlowId) {
      ticketIdForLock = ticket.id;
    }

    if (ticket.sendWelcomeFlow && !chatFlowInitiationLocks.has(ticket.id)) {
      chatFlowInitiationLocks.add(ticket.id);
      logger.info(
        `[WhatsApp] Ticket ${ticket.id} tem permissão para iniciar o ChatFlow. Executando...`
      );

      await VerifyStepsChatFlowTicket(msg, ticket);
      await ticket.update({ sendWelcomeFlow: false });
      logger.info(
        `[WhatsApp] Permissão 'sendWelcomeFlow' para o ticket ${ticket.id} foi desativada.`
      );
    } else if (!ticket.sendWelcomeFlow && ticket.chatFlowId) {
      logger.info(
        `[WhatsApp] Ticket ${ticket.id} em atendimento normal. Verificando passos do ChatFlow.`
      );
      await VerifyStepsChatFlowTicket(msg, ticket);
    }
    const ticketKey = `ticket_${whatsapp.id}_${contact.id}`;
    if (activeTicketsCache.has(ticketKey)) {
      activeTicketsCache.set(ticketKey, {
        ticketId: ticket.id,
        timestamp: Date.now(),
      });
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
    channelCache.delete(whatsapp.id);
  } finally {
    if (ticketIdForLock) {
      chatFlowInitiationLocks.delete(ticketIdForLock);
      logger.info(
        `[WhatsApp] Lock de iniciação do ChatFlow liberado para o ticket ${ticketIdForLock}.`
      );
    }
  }
};
