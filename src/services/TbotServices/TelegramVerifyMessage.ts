import { Context } from "telegraf";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import CreateMessageService from "../MessageServices/CreateMessageService";
import getQuotedForMessageId from "../../helpers/getQuotedForMessageId";

const VerifyMessage = async (
  ctx: Context | any,
  fromMe: boolean,
  ticket: Ticket,
  contact: Contact
): Promise<void> => {
  // const quotedMsg = await VerifyQuotedMessage(msg);
  // logger.error(err);
  let message;

  let updateMessage: any = {};
  message = ctx?.message || ctx.update.callback_query.message;
  updateMessage = ctx?.update;

  // Verificar se mensagem foi editada.
  if (!message && updateMessage) {
    message = updateMessage?.edited_message;
  }

  let quotedMsgId;
  if (message?.reply_to_message?.message_id) {
    const messageQuoted = await getQuotedForMessageId(
      message.reply_to_message.message_id,
      ticket.tenantId
    );
    quotedMsgId = messageQuoted?.id || undefined;
  }

  const messageData = {
    messageId: String(message?.message_id),
    ticketId: ticket.id,
    contactId: fromMe ? undefined : contact.id,
    body: ctx.update.callback_query
      ? ctx.update.callback_query.data
      : message.text,
    fromMe,
    read: fromMe,
    mediaType: "chat",
    quotedMsgId,
    timestamp: +message.date * 1000,
    status: "received",
    ack: 2,
  };
  function reduzirString(mensagem: any) {
    mensagem = String(mensagem); // Garantindo que seja uma string
    return mensagem.length > 255 ? mensagem.slice(0, 200) + "..." : mensagem;
  }

  await ticket.update({
    lastMessage: reduzirString(message.text),
    lastMessageAt: new Date().getTime(),
    answered: fromMe || false,
  });

  try {
    await CreateMessageService({
      messageData,
      tenantId: ticket.tenantId,
    });
  } catch (error) {
    console.log(error);
  }
};

export default VerifyMessage;
