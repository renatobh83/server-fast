import Ticket from "../../models/Ticket";
import { v4 as uuidV4 } from "uuid";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { AppError } from "../../errors/errors.helper";

export const VerifyMessageMediaChatClient = async (
  mediaUrl: any,
  ticket: Ticket
) => {
  try {
    const relativePath = new URL(mediaUrl.trim()).pathname;

    const messageData = {
      messageId: uuidV4(),
      ticketId: ticket.id,
      mediaUrl: relativePath.replace(/\\/g, "/").split("/")[2],
      contactId: ticket.contactId,
      body: "Imagem Recebida", // aqui vai a URL da imagem
      mediaType: "image",
      fromMe: false,
      read: true,
      timestamp: new Date().getTime(),
      status: "received",
      ack: 2,
    };

    await ticket.update({
      lastMessage: "imagem",
      lastMessageAt: new Date().getTime(),
      answered: false,
    });

    await CreateMessageService({ messageData, tenantId: ticket.tenantId });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_VERIFY_MESSAGE_MEDIA_CHAT_CLIENT_SERVICE", 500);
  }
};
