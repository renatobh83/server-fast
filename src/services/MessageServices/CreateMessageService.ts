import { AppError } from "../../errors/errors.helper";
import socketEmit from "../../helpers/socketEmit";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

interface MessageData {
  id?: string;
  messageId: string;
  ticketId: number;
  body?: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  timestamp?: number;
  ack?: number;
  isForwarded?: boolean;
}

interface Request {
  messageData: MessageData;
  tenantId: number;
}

const CreateMessageService = async ({
  messageData,
  tenantId,
}: Request): Promise<Message> => {
  const modelAttributes = Object.keys(Message.rawAttributes);

  const filterValidAttributes = (data: any) => {
    return Object.fromEntries(
      Object.entries(data).filter(([key]) => modelAttributes.includes(key))
    );
  };

  try {
    const [message, created] = await Message.findOrCreate({
      where: { messageId: messageData.messageId, tenantId },
      defaults: filterValidAttributes({ ...messageData, tenantId }),
      ignoreDuplicates: true,
    });

    // 🔄 Sempre recarrega com includes, mesmo que já existisse
    const reloadedMessage = await Message.findByPk(message.id, {
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
        {
          model: Contact,
          as: "contact",
        },
      ],
    });

    if (!reloadedMessage) {
      throw new AppError("ERR_CREATING_MESSAGE", 501);
    }

    // 🔔 Emite evento de nova mensagem no socket
    socketEmit({
      tenantId,
      type: "chat:create",
      payload: reloadedMessage,
    });

    return reloadedMessage;
  } catch (error) {
    console.error(error);
    throw new AppError("ERR_CREATING_MESSAGE", 501);
  }
};

export default CreateMessageService;
