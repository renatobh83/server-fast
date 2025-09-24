import { Op } from "sequelize";
import { AppError } from "../../errors/errors.helper";
import socketEmit from "../../helpers/socketEmit";
import Contact from "../../models/Contact";
import User from "../../models/User";
import ListSettingsService from "../SettingServices/ListSettingsService";
import ShowTicketService from "./ShowTicketService";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import CheckChatBotFlowWelcome from "../WbotServices/Helpers/CheckChatBotFlowWelcome";

interface Data {
  contact: Contact;
  whatsappId: number;
  unreadMessages: number;
  tenantId: number;
  groupContact?: boolean;
  msg?: any;
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
    // // if (msg?.fromMe) {
    // //   const msgCampaign = await CampaignContacts.findOne({
    // //     where: {
    // //       contactId: contact.id,
    // //       messageId: msg.id || msg.message_id || msg.item_id,
    // //     },
    // //   });

    // //   if (msgCampaign?.id) {
    // //     return { isCampaignMessage: true };
    // //   }
    // // }

    // if (msg?.fromMe) {
    //   // const farewellMessage = await Message.findOne({
    //   //   where: { messageId: msg.id || msg.message_id || msg.item_id },
    //   //   include: {
    //   //     model: Ticket,
    //   //     as: "ticket",
    //   //   },
    //   // });
    //   // if (
    //   //   farewellMessage?.toJSON().ticket?.status === "closed" &&
    //   //   farewellMessage?.toJSON().ticket.lastMessage === msg.body
    //   // ) {
    //   //   const ticket = farewellMessage.ticket as any;
    //   //   ticket.isFarewellMessage = true;
    //   //   return ticket;
    //   // }
    // }

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
          as: "whatsapp",
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
            as: "whatsapp",
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

    // await CreateLogTicketService({
    //   ticketId: ticketCreated.id,
    //   tenantId,
    //   type: "create",
    // });

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
