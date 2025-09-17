// import Ticket from "../../models/Ticket";
// import { v4 as uuidV4 } from "uuid";
// import CreateMessageService from "../MessageServices/CreateMessageService";
// import AppError from "../../errors/AppError";
// export const VerifyMessageChatClient = async (msg: any, ticket: Ticket) => {
//   try {
//     const messageData = {
//       messageId: uuidV4(),
//       ticketId: ticket.id,
//       contactId: ticket.contactId,
//       body: msg,
//       fromMe: false,
//       read: true,
//       timestamp: new Date().getTime(),
//       status: "received",
//       mediaType: "chat",
//       ack: 2,
//     };

//     await ticket.update({
//       lastMessage: msg.length > 255 ? msg.slice(0, 252) + "..." : msg,
//       lastMessageAt: new Date().getTime(),
//       answered: false,
//     });

//     await CreateMessageService({ messageData, tenantId: ticket.tenantId });
//   } catch (error: any) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError("ERR_VERIFY_MESSAGE_CHAT_CLIENT_SERVICE", 502, {
//       origin: "VerifyMessageChatClient",
//       cause: error,
//     });
//   }
// };
