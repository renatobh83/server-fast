import { Op } from "sequelize";
import type { Message as WpMessage } from "wbotconnect";
import socketEmit from "../../helpers/socketEmit";

import Contact from "../../models/Contact";
import MessageModel from "../../models/Message";
import Ticket from "../../models/Ticket";
import User from "../../models/User";

import ShowTicketService from "./ShowTicketService";
import ListSettingsService from "../SettingServices/ListSettingsService";
import CheckChatBotFlowWelcome from "../WbotServices/Helpers/CheckChatBotFlowWelcome";
import { AppError } from "../../errors/errors.helper";
import { getCache, setCache } from "../../utils/cacheRedis";
import { RedisKeys } from "../../constants/redisKeys";

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
  // se for uma mensagem de campanha, não abrir tícke

  try {
    let ticket = await Ticket.findOne({
      where: {
        status: {
          [Op.or]: ["open", "pending"],
        },
        tenantId,
        whatsappId,
        contactId: contact.id,
      },
      include: [
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
      ],
    });

    if (ticket) {
      unreadMessages =
        ["telegram", "waba", "instagram", "messenger"].includes(channel) &&
        unreadMessages > 0
          ? (unreadMessages += ticket.unreadMessages)
          : unreadMessages;
      await ticket.update({ unreadMessages });
      socketEmit({
        tenantId,
        type: "ticket:update",
        payload: ticket,
      });
      return ticket;
    }

    if (groupContact) {
      ticket = await Ticket.findOne({
        where: {
          contactId: contact.id,
          tenantId,
          whatsappId,
        },
        order: [["updatedAt", "DESC"]],
        include: [
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
        ],
      });

      if (ticket) {
        await ticket.update({
          status: "pending",
          userId: undefined,
          unreadMessages,
        });

        socketEmit({
          tenantId,
          type: "ticket:update",
          payload: ticket,
        });

        return ticket;
      }
    } else {
      ticket = await Ticket.findOne({
        where: {
          // updatedAt: {
          //   [Op.between]: [+subHours(new Date(), 24), +new Date()]
          // },
          status: {
            [Op.in]: ["open", "pending"],
          },
          tenantId,
          whatsappId,
          contactId: contact.id,
        },
        order: [["updatedAt", "DESC"]],
        include: [
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
        ],
      });
      if (ticket) {
        await ticket.update({
          status: "pending",
          userId: undefined,
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

    if (
      (msg && !msg.fromMe) ||
      (!ticketCreated.userId && !msg.author) ||
      isSync
    ) {
      await CheckChatBotFlowWelcome(ticketCreated);
    }

    ticket = await ShowTicketService({ id: ticketCreated.id, tenantId });

    ticket.setDataValue("isCreated", true);

    socketEmit({
      tenantId,
      type: "ticket:update",
      payload: ticket,
    });

    return ticket;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    console.log(error);
    throw new AppError("ERR_FIND_OR_CREATE_TICKET_SERICE", 500);
  }
};

export default FindOrCreateTicketService;
