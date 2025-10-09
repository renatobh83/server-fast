import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import CreateMessageService from "../MessageServices/CreateMessageService";
import VerifyQuotedMessage from "./Helpers/VerifyQuotedMessage";

const VerifyMessage = async (
  msg: any,
  ticket: Ticket,
  contact: Contact,
  authorGroupMessage?: string
) => {
  // Definir o contactId de forma clara
  let contactId: number | undefined;

  if (msg.isGroupMsg) {
    if (msg.fromMe) {
      contactId = contact.id;
    } else {
      contactId = authorGroupMessage ? Number(authorGroupMessage) : undefined;
    }
  } else {
    contactId = msg.fromMe ? contact.id : contact.id;
  }
  const body = msg.type === "list" ? msg.list.description : msg.content;

  const quotedMsg = await VerifyQuotedMessage(msg);

  const messageData = {
    messageId: msg.id,
    ticketId: ticket.id,
    contactId,
    body,
    mediaType: msg.type,
    read: msg.fromMe,
    quotedMsgId: quotedMsg?.messageId,
    status: msg.fromMe ? "sended" : "received",
    ...msg,
  };

  await CreateMessageService({ messageData, tenantId: ticket.tenantId });

  // Normalizar lastMessage
  let lastMessage: string;
  if (msg.type === "list") {
    lastMessage = "Atendimento Bot";
  } else {
    lastMessage =
      msg.content.length > 255
        ? msg.content.slice(0, 252) + "..."
        : msg.content;
  }

  await ticket.update({
    lastMessage,
    lastMessageAt: Date.now(),
    answered: !!msg.fromMe,
  });
};

export default VerifyMessage;
