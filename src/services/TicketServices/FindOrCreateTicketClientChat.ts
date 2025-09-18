import { Op } from "sequelize";
import { AppError } from "../../errors/errors.helper";
import socketEmit from "../../helpers/socketEmit";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";

interface PropsClient {
  client: any;
  socketId: any;
}

export const FindOrCreateTicketClientChat = async ({
  client,
  socketId,
}: PropsClient) => {
  try {
    const { empresaId, tenantId, email, name } = client;
    const channel = await Whatsapp.findOne({
      where: {
        tenantId,
        type: "web",
      },
      attributes: ["id"],
      raw: true,
    });
    if (!channel) {
      throw new AppError("CHANNEL_NO_FOUND", 404);
    }
    let contact = await Contact.findOne({
      where: {
        email,
      },
    });

    if (!contact) {
      contact = await Contact.create({
        name,
        email,
        tenantId,
      });
    }

    let ticket = await Ticket.findOne({
      where: {
        status: {
          [Op.or]: ["open", "pending"],
        },
        tenantId,
        whatsappId: channel.id,
        contactId: contact.id,
        empresaId,
        chatClient: true,
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
      ticket.update({ socketId });
      socketEmit({
        tenantId,
        type: "ticket:update",
        payload: ticket,
      });
      return ticket;
    }

    const ticketObj: any = {
      status: "pending",
      whatsappId: channel.id,
      tenantId,
      channel: "chatClient",
      chatClient: true,
      contactId: contact.id,
      empresaId,
      socketId,
    };

    ticket = await Ticket.create(ticketObj);

    ticket.setDataValue("isCreated", true);
    // Busca novamente incluindo os dados da empresa (join)
    const ticketWithCompany = await Ticket.findByPk(ticket.id, {
      include: [{ model: Empresa, as: "empresa", attributes: ["name"] }], // ou o alias que estiver no seu relacionamento
    });

    const empresanome = ticketWithCompany?.toJSON().empresa.name || null;

    socketEmit({
      tenantId,
      type: "ticket:update",
      payload: {
        ...ticket.toJSON(), // ou ticketWithCompany.toJSON()
        empresanome,
      },
    });

    return ticket;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    console.log(error);
    throw new AppError("ERR_FIND_OR_CREATE_TICKET_CLIENT_CHAT", 500);
  }
};
