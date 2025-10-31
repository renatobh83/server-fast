import { AppError } from "../../errors/errors.helper";
import socketEmit from "../../helpers/socketEmit";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { v4 as uuidV4 } from "uuid";

export const UpdateBotMessage = async (
  messageSent: any,
  ticket: Ticket
): Promise<void> => {
  try {
    const messageData = {
      ticketId: ticket.id,
      body: "",
      contactId: ticket.contactId,
      fromMe: true,
      read: true,
      mediaType: "chat",
      mediaUrl: undefined,
      timestamp: new Date().getTime(),
      quotedMsgId: undefined,
      userId: ticket.userId ? ticket.userId : undefined,
      scheduleDate: undefined,
      sendType: "bot",
      status: "pending",
      tenantId: ticket.tenantId,
    };

    let existingMessage = await Message.findOne({
      where: { messageId: messageSent.id || messageSent.messageId || null },
    });

    if (existingMessage) {
      await existingMessage.update({
        ...messageData,
        ...messageSent,
        mediaType: "bot",
      });
    } else {
      existingMessage = await Message.create({
        ...messageData,
        ...messageSent,
        id: messageSent.id || messageSent.messageId || uuidV4(),
        messageId: messageSent.id || messageSent.messageId || null,
        mediaType: "bot",
      });
    }

    const messageCreated = await Message.findByPk(existingMessage.id, {
      include: [
        {
          model: Ticket,
          as: "ticket",
          where: { tenantId: ticket.tenantId },
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
      throw new AppError("ERR_CREATING_MESSAGE_SYSTEM", 404);
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
      tenantId: ticket.tenantId,
      type: "chat:create",
      payload: messageCreated,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_UPDATE_BOT_MESSAGE", 500);
  }
};
