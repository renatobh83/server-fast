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
}
interface Request {
  messageData: MessageData;
  tenantId: number;
}
const CreateMessageService = async ({
  messageData,
  tenantId,
}: Request): Promise<Message> => {
  let message: Message;
  let created: boolean;
  const modelAttributes = Object.keys(Message.rawAttributes);

  const filterValidAttributes = (data: any) => {
    return Object.fromEntries(
      Object.entries(data).filter(([key]) => modelAttributes.includes(key))
    );
  };

  try {
    // Tenta encontrar a mensagem; se não encontrar, a cria.
    // O 'include' aqui só é aplicado se a mensagem for ENCONTRADA.
    [message, created] = await Message.findOrCreate({
      where: { messageId: messageData.messageId, tenantId },
      defaults: filterValidAttributes({ ...messageData, tenantId }), // Dados para criar se não for encontrada
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
      ignoreDuplicates: true,
    });
  } catch (error: any) {
    console.log(error);
    throw new AppError("ERR_CREATING_MESSAGE", 501);
  }

  // Se a mensagem foi recém-criada, as associações não foram carregadas pelo findOrCreate.
  // Precisamos recarregá-la com as associações.
  if (created) {
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
      // Isso é um caso improvável, mas é bom ter uma verificação.
      throw new AppError("ERR_CREATING_MESSAGE", 501);
    }
    message = reloadedMessage;
    socketEmit({
      tenantId,
      type: "chat:create",
      payload: reloadedMessage,
    });
    // A mensagem agora contém todas as associações, seja ela encontrada ou recém-criada.
  }
  return message;
};
export default CreateMessageService;
