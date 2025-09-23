import { AppError } from "../../errors/errors.helper";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import ShowTicketService from "../TicketServices/ShowTicketService";

interface Request {
  ticketId: string;
  tenantId: number | string;
  pageNumber?: string;
}

interface Response {
  messages: any[];
  ticket: Ticket;
  count: number;
  hasMore: boolean;
}

const ListMessagesService = async ({
  pageNumber = "1",
  ticketId,
  tenantId,
}: Request): Promise<Response> => {
  const ticket = await ShowTicketService({ id: ticketId, tenantId });

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  // await setMessagesAsRead(ticket);
  const limit = 30;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: messages } = await Message.findAndCountAll({
    where: { ticketId },
    limit,
    include: [
      "contact",
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"],
      },
      {
        model: Ticket,
        as: "ticket",
        where: {
          queueId: ticket.queueId,
          contactId: ticket.contactId,
          whatsappId: ticket.whatsappId,
        },

        required: true,
      },
    ],
    offset,
    // logging: console.log,
    order: [["createdAt", "DESC"]],
    // order: [
    //   Sequelize.literal(
    //     'coalesce(to_timestamp("Message"."timestamp") , "Message"."createdAt") desc'
    //   )
    // ]
  });

  const hasMore = count > offset + messages.length;
  // console.log(messages.reverse())
  return {
    messages: messages.reverse(),
    ticket,
    count,
    hasMore,
  };
};

export default ListMessagesService;
