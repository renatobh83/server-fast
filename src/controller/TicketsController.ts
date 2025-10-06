import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import { handleServerError } from "../errors/errors.helper";
import CreateTicketService from "../services/TicketServices/CreateTicketService";
import DeleteTicketService from "../services/TicketServices/DeleteTicketService";
import { getIO } from "../lib/socket";
import ListTicketsService from "../services/TicketServices/ListTicketsService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import { Op } from "sequelize";
import Message from "../models/Message";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import Whatsapp from "../models/Whatsapp";
import { pupa } from "../utils/pupa";
import { CreateMessageSystemService } from "../services/MessageServices/CreateMessageSystemService";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";

export const apagarTicket = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  const { ticketId } = request.params as any;
  try {
    const ticket = await DeleteTicketService({ id: ticketId, tenantId });
    const io = getIO();
    io.to(`${tenantId}:${ticket.status}`)
      .to(`${tenantId}:${ticketId}`)
      .to(`${tenantId}:notification`)
      .emit(`${tenantId}:ticket`, {
        action: "delete",
        ticketId: +ticketId,
      });

    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "ticket deleted" });
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const listarTickets = async (
  request: FastifyRequest<{
    Querystring: {
      searchParam: string;
      pageNumber: string;
      status: string;
      date: string;
      showAll: string;
      withUnreadMessages: string;
      queuesIds: string[];
      isNotAssignedUser: string;
      includeNotQueueDefined: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { tenantId, id, profile } = request.user as any;
    const payload = {
      ...request.query,
      tenantId,
      userId: id,
      profile,
      status: request.query.status.split(","),
    };
    const tickets = await ListTicketsService(payload);
    return reply.code(STANDARD.OK.statusCode).send(tickets);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
export const mostrarTicket = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { tenantId } = request.user as any;
    const { ticketId } = request.params as { ticketId: number };

    const ticket = await ShowTicketService({ id: ticketId, tenantId });

    const where = {
      contactId: ticket.contactId,
      scheduleDate: { [Op.not]: null },
      status: "pending",
    };
    const scheduledMessages = await Message.findAll({
      where,
      // logging: console.log
    });

    ticket.setDataValue("scheduledMessages", scheduledMessages);
    return reply.code(STANDARD.OK.statusCode).send(ticket);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const updateTicket = async (
  request: FastifyRequest<{
    Body: {
      contactId: number;
      status: string;
      userId: number;
      isActiveDemand: boolean;
      channel: string;
      channelId?: number;
      isTransference: boolean;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { tenantId, id } = request.user as any;
    const { ticketId } = request.params as { ticketId: number };
    const { isTransference } = request.body;
    const payload = {
      ticketData: {
        ...request.body,
        tenantId,
      },
      ticketId,
      isTransference,
      userIdRequest: id,
    };
    const { ticket } = await UpdateTicketService(payload);

    if (ticket.status === "closed") {
      const inTicket = await Ticket.findByPk(ticket.id, {
        include: [
          {
            model: Contact,
            as: "contact",
          },
        ],
      });

      const whatsapp = await Whatsapp.findOne({
        where: { id: ticket.whatsappId, tenantId },
      });
      if (whatsapp?.farewellMessage) {
        const body = pupa(whatsapp.farewellMessage || "", {
          protocol: ticket.protocol,
          name: ticket.contact.name,
        });
        const messageData = {
          message: { body, fromMe: true, read: true },
          tenantId,
          ticket: inTicket!,
          userId: id,
          sendType: "bot",
          status: "pending",
          isTransfer: false,
          note: false,
        };
        await CreateMessageSystemService(messageData);
        inTicket!.update({ isFarewellMessage: true });
      }
    }

    return reply.code(STANDARD.OK.statusCode).send(ticket);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
export const createTicket = async (
  request: FastifyRequest<{
    Body: {
      contactId: number;
      status: string;
      channel: string;
      channelId?: number;
      isTransference: boolean;
    };
  }>,
  reply: FastifyReply
) => {
  const { tenantId, id } = request.user as any;
  const payload = { ...request.body, userId: id, tenantId };
  try {
    const ticket = await CreateTicketService(payload);
    if (!id) {
      const io = getIO();

      let statusOrId: string;

      if ("existingTicketId" in ticket) {
        // ticket é do tipo { existingTicketId, message }
        statusOrId = ticket.existingTicketId.status;
      } else {
        // ticket é do tipo Ticket
        statusOrId = ticket.status;
      }

      io.to(`${tenantId}:${statusOrId}`).emit(`${tenantId}:ticket`, {
        action: "create",
        ticket,
      });
    }
    return reply.code(STANDARD.OK.statusCode).send(ticket);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
