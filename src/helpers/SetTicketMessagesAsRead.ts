import Message from "../models/Message";
import type Ticket from "../models/Ticket";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import GetTicketWbot from "../services/WbotServices/Helpers/GetTicketWbot";
import { logger } from "../utils/logger";
import socketEmit from "./socketEmit";

const SetTicketMessagesAsRead = async (ticket: Ticket): Promise<void> => {
  await Message.update(
    { read: true },
    {
      where: {
        ticketId: ticket.id,
        read: false,
      },
    }
  );
  await ticket.update({ unreadMessages: 0 });

  try {
    if (
      ticket.channel === "whatsapp" &&
      !ticket.isGroup &&
      ticket.contact.number !== "0"
    ) {
      const wbot = await GetTicketWbot(ticket);

      wbot
        .sendSeen(ticket.contact.serializednumber!)
        .catch((e: any) =>
          console.error("não foi possível marcar como lido", e)
        );
    }
  } catch (err) {
    logger.warn(
      `Could not mark messages as read. Maybe whatsapp session disconnected? Err: ${err}`
    );
    // throw new Error("ERR_WAPP_NOT_INITIALIZED");
  }

  const ticketReload = await ShowTicketService({
    id: ticket.id,
    tenantId: ticket.tenantId,
  });

  socketEmit({
    tenantId: ticket.tenantId,
    type: "ticket:update",
    payload: ticketReload,
  });
};

export default SetTicketMessagesAsRead;
