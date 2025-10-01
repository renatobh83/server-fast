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
    fromMe: msg.fromMe,
    mediaType: msg.type,
    read: msg.fromMe,
    quotedMsgId: quotedMsg?.messageId,
    timestamp: msg.timestamp,
    status: msg.fromMe ? "sended" : "received",
  };
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

  await CreateMessageService({ messageData, tenantId: ticket.tenantId });
  // const messageData = {
  //   messageId: msg.id,
  //   ticketId: ticket.id,
  //   contactId: msg.isGroupMsg
  //     ? authorGroupMsgId
  //     : msg.fromMe
  //     ? undefined
  //     : contact.id,
  //   body: msg.type === "list" ? msg.list.description : msg.content,
  //   fromMe: msg.fromMe,
  //   mediaType: msg.type,
  //   read: msg.fromMe,
  //   quotedMsgId: quotedMsg?.messageId,
  //   timestamp: msg.timestamp,
  //   status: msg.fromMe ? "sended" : "received",
  // };

  // await ticket.update({
  //   lastMessage:
  //     msg.type === "list"
  //       ? "Atendimento Bot"
  //       : msg.content.length > 255
  //       ? msg.content.slice(0, 252) + "..."
  //       : msg.content,
  //   lastMessageAt: new Date().getTime(),
  //   answered: msg.fromMe || false,
  // });

  // await CreateMessageService({ messageData, tenantId: ticket.tenantId });
};

export default VerifyMessage;
