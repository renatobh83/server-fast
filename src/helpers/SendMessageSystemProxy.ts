// // import type { Message as WbotMessage } from "@wppconnect-team/wppconnect";
// // import type { Message as WbotMessage } from "wbotconnect";
// import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
// import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
// import TelegramSendMessagesSystem from "../services/TbotServices/TelegramSendMessagesSystem";
// import { getTbot } from "../libs/tbot";
// import { SendMessageChatClient } from "../services/ChatClientService/SendMessageChatClient";
// import { SendMessageMediaChatClient } from "../services/ChatClientService/SendMessageMediaChatClient";
// type Payload = {
//   ticket: any;
//   messageData: any;
//   media: any;
//   userId: any;
// };
// interface CustomMessage extends WbotMessage {
//   messageId?: string;
// }

// const SendMessageSystemProxy = async ({
//   ticket,
//   messageData,
//   media,
//   userId,
// }: Payload): Promise<any> => {
//   let message: any | null = null; // Inicializa com um valor padrão

//   if (messageData.mediaName) {
//     switch (ticket.channel) {
//       case "telegram":
//         message = await TelegramSendMessagesSystem(
//           getTbot(ticket.whatsappId),
//           ticket,
//           { ...messageData, media }
//         );
//         break;
//       case "whatsapp":
//         message = await SendWhatsAppMedia({ media, ticket, userId });
//         break;
//       default:
//         message = await SendMessageMediaChatClient(media, ticket);
//     }
//   }

//   if (!media) {
//     switch (ticket.channel) {
//       case "telegram":
//         message = await TelegramSendMessagesSystem(
//           getTbot(ticket.whatsappId),
//           ticket,
//           messageData
//         );
//         break;
//       case "whatsapp":
//         message = await SendWhatsAppMessage({
//           body: messageData.body,
//           ticket,
//           quotedMsg: messageData?.quotedMsg,
//         });
//         break;
//       default:
//         message = await SendMessageChatClient(messageData, ticket);
//     }
//   }

//   if (message && message.ack === 0) return null;

//   return message;
// };

// export default SendMessageSystemProxy;