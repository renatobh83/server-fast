// import CreateMessageSystemService from "../MessageServices/CreateMessageSystemService";
// import { FindOrCreateTicketClientChat } from "../TicketServices/FindOrCreateTicketClientChat";
// import VerifyBusinessHoursFlow from "../WbotServices/Helpers/VerifyBusinessHoursFlow";
// import { GetMessagesByTicketId } from "./GetMessagesByTicketId";
// import { VerifyMessageChatClient } from "./VerifyMessageChatClient";
// import { VerifyMessageMediaChatClient } from "./VerifyMessageMediaChatClient";
// import socketEmit from "../../helpers/socketEmit";
// import AppError from "../../errors/AppError";

// export const HandleMessageChatClient = async (socket: any) => {
//   try {
//     const { id } = socket;
//     const { auth } = socket.handshake;
//     console.log("Socket conectado:", socket.id);

//     let ticket;
//     try {
//       ticket = await FindOrCreateTicketClientChat({
//         client: auth,
//         socketId: socket.id,
//       });
//     } catch (err) {
//       return;
//     }
//     if (!ticket) {
//       console.warn("Ticket retornado é null ou undefined");
//       return;
//     }
//     socket.emit("chat:ready", { ticketId: ticket.id });
//     socket.join(`chat-${id}`);
//     if (ticket.isCreated) {
//       const isBusinessHours = await VerifyBusinessHoursFlow(ticket);

//       if (isBusinessHours) {
//         await CreateMessageSystemService({
//           msg: {
//             body: "👋 Oi! Que bom ter você por aqui. Em instantes, um de nossos atendentes vai te responder. Fique à vontade para enviar sua mensagem!",
//           },
//           tenantId: ticket.tenantId,
//           ticket,
//           sendType: "chat",
//           status: "pending",
//         });
//         socket.emit("chat:boasVindas");
//       } else {
//         setTimeout(
//           () =>
//             socket.emit(
//               "chat:closedTicket",
//               "Seu ticket foi fechado. Obrigado!"
//             ),
//           20_000
//         );
//         ticket.update({
//           status: "closed",
//           lastMessage: "Fora do horario de atendimento",
//           closedAt: new Date().getTime(),
//         });
//         ticket.reload();
//         socketEmit({
//           tenantId: ticket.tenantId,
//           type: "ticket:update",
//           payload: ticket,
//         });
//       }
//     }

//     if (!ticket.isCreated) {
//       socket.on("chat:getMessages", async (value: { offset: any }) => {
//         const { offset } = value;
//         const Oldmessages = await GetMessagesByTicketId({
//           ticketId: ticket.id,
//           limit: 50,
//           offset,
//         });
//         socket.emit("chat:previousMessages", Oldmessages);
//       });
//     }

//     socket.on("chat:message", async (msg: any) => {
//       await VerifyMessageChatClient(msg, ticket);
//     });

//     socket.on("chat:image", async (media: any) => {
//       await VerifyMessageMediaChatClient(media, ticket);
//     });
//   } catch (error: any) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError("ERR_HANDLE_MESSAGE_CHAT_CLIENT_SERVICE", 502, {
//       origin: "HandleMessageChatClient",
//       cause: error,
//     });
//   }
// };
