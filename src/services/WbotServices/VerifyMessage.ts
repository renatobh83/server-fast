import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { GetContactByNumber } from "./Helpers/GetContactByNumber";
import VerifyQuotedMessage from "./Helpers/VerifyQuotedMessage";

const VerifyMessage = async (msg: any, ticket: Ticket, contact: Contact) => {
  const quotedMsg = await VerifyQuotedMessage(msg);

  let authorGroupMsgId: any = 0;
  if (msg.isGroupMsg) {
    authorGroupMsgId = await GetContactByNumber(msg.author);
  }

  const messageData = {
    messageId: msg.id,
    ticketId: ticket.id,
    contactId: msg.isGroupMsg
      ? authorGroupMsgId
      : msg.fromMe
      ? undefined
      : contact.id,
    body: msg.type === "list" ? msg.list.description : msg.content,
    fromMe: msg.fromMe,
    mediaType: msg.type,
    read: msg.fromMe,
    quotedMsgId: quotedMsg?.messageId,
    timestamp: msg.timestamp,
    status: msg.fromMe ? "sended" : "received",
  };

  await ticket.update({
    lastMessage:
      msg.type === "list"
        ? "Atendimento Bot"
        : msg.content.length > 255
        ? msg.content.slice(0, 252) + "..."
        : msg.content,
    lastMessageAt: new Date().getTime(),
    answered: msg.fromMe || false,
  });

  await CreateMessageService({ messageData, tenantId: ticket.tenantId });
};

export default VerifyMessage;
