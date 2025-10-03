import type { Message as WbotMessage } from "wbotconnect";
import SendWhatsAppMessage from "../services/WbotServices/Helpers/SendWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/Helpers/SendWhatsAppMedia";
import TelegramSendMessagesSystem from "../services/TbotServices/TelegramSendMessagesSystem";
import { getTbot, requireTbot } from "../lib/tbot";
import { SendMessageMediaChatClient } from "../services/ChatClientService/SendMessageMediaChatClient";
import { SendMessageChatClient } from "../services/ChatClientService/SendMessageChatClient";
import { transformFile } from "../utils/transformFile";

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
    case "telegram":
      message = await TelegramSendMessagesSystem(
        requireTbot(ticket.whatsappId),
        ticket,
        hasMedia ? { ...messageData, media } : messageData
      );
      break;

    case "whatsapp":
      if (hasMedia) {
        const mediaTransforme = await transformFile(media);
        message = await SendWhatsAppMedia({
          media: mediaTransforme,
          ticket,
          userId,
        });
      } else {
        message = await SendWhatsAppMessage({
          body: messageData.body,
          ticket,
          quotedMsg: messageData?.quotedMsg,
        });
      }
      break;

    default:
      message = hasMedia
        ? await SendMessageMediaChatClient(media, ticket)
        : await SendMessageChatClient(messageData, ticket);
  }

  // Se a mensagem foi enviada mas ainda está "pendente"
  if (message?.ack === 0) return null;

  return message;
};

export default SendMessageSystemProxy;
