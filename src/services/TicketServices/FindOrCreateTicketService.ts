import { Op } from "sequelize";
import type { Message as WpMessage } from "wbotconnect";
import socketEmit from "../../helpers/socketEmit";

import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import User from "../../models/User";

import ShowTicketService from "./ShowTicketService";
import ListSettingsService from "../SettingServices/ListSettingsService";
import CheckChatBotFlowWelcome from "../WbotServices/Helpers/CheckChatBotFlowWelcome";
import { AppError } from "../../errors/errors.helper";

import Message from "../../models/Message";
import CreateLogTicketService from "./CreateLogTicketService";

interface Data {
  contact: Contact;
  whatsappId: number;
  unreadMessages: number;
  tenantId: number;
  groupContact?: boolean;
  msg?: WpMessage | any;
  isSync?: boolean;
  channel: string;
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const FindOrCreateTicketService = async ({
  contact,
  whatsappId,
  unreadMessages,
  tenantId,
  groupContact,
  msg,
  isSync,
  channel,
}: Data): Promise<Ticket | any> => {
  try {
    if (msg.fromMe) {
      // await sleep(2000);
      const farewellMessage = await Message.findOne({
        where: {
          messageId: msg.id || msg.id?.id || msg.message_id || msg.item_id,
        },
        include: [
          {
            model: Ticket,
            as: "ticket",
          },
        ],
      });

      if (
        farewellMessage?.ticket?.status === "closed" &&
        farewellMessage?.ticket.lastMessage === msg.body
      ) {
        const ticket = farewellMessage.ticket as any;
        ticket.isFarewellMessage = true;
        return ticket;
      }
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

    let ticket: Ticket | null = null;

    // 1. Tenta encontrar um ticket existente com status 'open' ou 'pending'
    ticket = await Ticket.findOne({
      where: {
        status: { [Op.or]: ["open", "pending"] },
        tenantId,
        whatsappId,
        contactId: contact.id,
      },
      include: commonIncludes,
    });

    if (ticket) {
      // Se encontrou, atualiza as mensagens não lidas e emite o evento
      const newUnreadMessages = [
        "telegram",
        "waba",
        "instagram",
        "messenger",
      ].includes(channel)
        ? unreadMessages + ticket.unreadMessages
        : unreadMessages;

      await ticket.update({ unreadMessages: newUnreadMessages });
      socketEmit({
        tenantId,
        type: "ticket:update",
        payload: ticket,
      });
      return ticket;
    }

    // 2. Se não encontrou ticket 'open'/'pending', aplica a lógica de groupContact
    if (groupContact) {
      // Para groupContact, tenta encontrar qualquer ticket anterior para reabrir
      ticket = await Ticket.findOne({
        where: {
          contactId: contact.id,
          tenantId,
          whatsappId,
        },
        order: [["updatedAt", "DESC"]],
        include: commonIncludes,
      });

      if (ticket) {
        // Se encontrou um ticket anterior (mesmo que fechado), reabre como 'pending'
        await ticket.update({
          status: "pending",
          userId: undefined, // Limpa o usuário atribuído
          unreadMessages,
        });

        socketEmit({
          tenantId,
          type: "ticket:update",
          payload: ticket,
        });

        return ticket;
      }
    }

    const DirectTicketsToWallets =
      (await ListSettingsService(tenantId))?.find(
        (s) => s.key === "DirectTicketsToWallets"
      )?.value === "enabled" || false;

    const ticketObj: any = {
      contactId: contact.id,
      status: "pending",
      isGroup: groupContact,
      unreadMessages,
      whatsappId,
      tenantId,
      channel,
    };

    if (DirectTicketsToWallets && contact.id) {
      const wallet: any = contact;
      const wallets = await wallet.getWallets();
      if (wallets?.[0]?.id) {
        ticketObj.status = "open";
        ticketObj.userId = wallets[0].id;
        ticketObj.startedAttendanceAt = new Date().getTime();
      }
    }

    const ticketCreated = await Ticket.create(ticketObj);
    await CreateLogTicketService({
      ticketId: ticketCreated.id,
      tenantId,
      type: "create",
    });
    if (
      (msg && !msg.fromMe) ||
      (!ticketCreated.userId && !msg.author) ||
      isSync
    ) {
      await CheckChatBotFlowWelcome(ticketCreated);
    }

    // Retorna o ticket recém-criado, utilizando ShowTicketService para garantir que todos os includes estejam presentes
    const finalTicket = await ShowTicketService({
      id: ticketCreated.id,
      tenantId,
    });

    finalTicket.setDataValue("isCreated", true);

    socketEmit({
      tenantId,
      type: "ticket:update",
      payload: finalTicket,
    });

    return finalTicket;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error(error); // Usar console.error para erros
    throw new AppError("ERR_FIND_OR_CREATE_TICKET_SERICE", 500);
  }
};

export default FindOrCreateTicketService;
