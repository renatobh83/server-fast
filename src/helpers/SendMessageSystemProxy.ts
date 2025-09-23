import type { Message as WbotMessage } from "wbotconnect";
import SendWhatsAppMessage from "../services/WbotServices/Helpers/SendWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/Helpers/SendWhatsAppMedia";

type Payload = {
  ticket: any;
  messageData: any;
  media?: any;
  userId?: any;
};

interface CustomMessage extends WbotMessage {
  messageId?: string;
}

const SendMessageSystemProxy = async ({
  ticket,
  messageData,
  media,
  userId,
}: Payload): Promise<any> => {
  const hasMedia = Boolean(messageData.mediaName && media);
  let message: any | null = null;

  switch (ticket.channel) {
    // case "telegram":
    //   message = await TelegramSendMessagesSystem(
    //     getTbot(ticket.whatsappId),
    //     ticket,
    //     hasMedia ? { ...messageData, media } : messageData
    //   );
    //   break;

    case "whatsapp":
      if (hasMedia) {
        message = await SendWhatsAppMedia({ media, ticket, userId });
      } else {
        message = await SendWhatsAppMessage({
          body: messageData.body,
          ticket,
          quotedMsg: messageData?.quotedMsg,
        });
      }
      break;

    default:
      break;
    //   message = hasMedia
    //     ? await SendMessageMediaChatClient(media, ticket)
    //     : await SendMessageChatClient(messageData, ticket);
  }

  // Se a mensagem foi enviada mas ainda está "pendente"
  if (message?.ack === 0) return null;

  return message;
};

export default SendMessageSystemProxy;
