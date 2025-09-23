import { Op } from "sequelize";
import socketEmit from "../../helpers/socketEmit";
import type Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { pupa } from "../../utils/pupa";
import { isEncrypted } from "./CreateMessageSystemService";
import { AppError } from "../../errors/errors.helper";
import { SendWhatsAppForwardMessage } from "../WbotServices/SendWhatsAppForwardMessage";

interface Request {
  message: Message;
  contact: Contact;
  userId?: number;
  tenantId: number;
  ticketIdOrigin: number;
}

const CreateForwardMessageService = async ({
  userId,
  tenantId,
  message,
  contact,
  ticketIdOrigin,
}: Request): Promise<void> => {
  const ticketOrigin = await ShowTicketService({
    id: ticketIdOrigin,
    tenantId,
  });

  let ticket: Ticket | undefined | null;
  ticket = await Ticket.findOne({
    where: {
      status: {
        [Op.or]: ["open", "pending"],
      },
      tenantId,
      contactId: contact.id,
    },
  });

  // caso não exista ticket aberto ou pendente
  if (!ticket) {
    ticket = await Ticket.create({
      contactId: contact.id,
      status: "open",
      isGroup: contact.isGroup,
      userId,
      tenantId,
      unreadMessages: 0,
      whatsappId: ticketOrigin.whatsappId,
      lastMessage:
        Message.decrypt(message.body).length > 255
          ? Message.decrypt(message.body).slice(0, 252) + "..."
          : Message.decrypt(message.body),
      lastMessageAt: new Date().getTime(),
      answered: true,
    });
  }
  await SendWhatsAppForwardMessage({ message, ticket, userId, contact });

  let decryptedMessage = isEncrypted(message.body)
    ? Message.decrypt(message.body)
    : message.body;

  if (decryptedMessage && !Array.isArray(decryptedMessage)) {
    decryptedMessage = pupa(decryptedMessage || "", {
      // greeting: será considerado conforme data/hora da mensagem internamente na função pupa
      protocol: ticket.protocol,
    });
  }

  let msgCreated = await Message.findOne({
    where: { messageId: message.messageId || message.id, tenantId },
  });

  if (!msgCreated) {
    msgCreated = await Message.create({
      body: decryptedMessage,
      status: "pending",
      contactId: contact.id,
      fromMe: true,
      read: true,
      messageId: message.messageId,
      mediaType: message?.mediaType,
      mediaUrl: message?.mediaName,
      mediaName: message?.mediaName,
      timestamp: new Date().getTime(),
      userId,
      scheduleDate: null as any,
      sendType: "chat",
      ticketId: ticket.id,
      tenantId,
    });
  }
  const messageCreated = await Message.findByPk(msgCreated.id, {
    include: [
      {
        model: Ticket,
        as: "ticket",
        where: { tenantId },
        include: ["contact"],
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"],
      },
    ],
  });
  if (!messageCreated) {
    // throw new AppError("ERR_CREATING_MESSAGE", 501);
    throw new AppError("ERR_CREATING_MESSAGE_SYSTEM", 501);
  }

  await ticket.update({
    lastMessage:
      Message.decrypt(messageCreated.body).length > 255
        ? Message.decrypt(messageCreated.body).slice(0, 252) + "..."
        : Message.decrypt(messageCreated.body),
    lastMessageAt: new Date().getTime(),
    answered: true,
  });

  socketEmit({
    tenantId,
    type: "chat:create",
    payload: messageCreated,
  });
};

export default CreateForwardMessageService;
