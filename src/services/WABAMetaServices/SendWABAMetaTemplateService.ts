// import axios from "axios";
// import { AppError } from "../../errors/errors.helper";
// import socketEmit from "../../helpers/socketEmit";
// import { logger } from "../../utils/logger";
// import Ticket from "../../models/Ticket";
// import Message from "../../models/Message";

// interface ISendTemplateMessageProps {
//   from: string;
//   phone_number_id: string;
//   message: string;
//   ticket: any;
//   tenantId: string | number;
//   idFront: string;
//   whatsapp: any;
//   language: string;
//   templateName: string;
//   components?: any[];
// }

// class SendTemplateMessageComponents {
//   async send({
//     from,
//     phone_number_id,
//     message,
//     ticket,
//     tenantId,
//     idFront,
//     whatsapp,
//     language,
//     templateName,
//     components,
//   }: ISendTemplateMessageProps) {
//     if (whatsapp.status === "PP_OFFLINE") {
//       throw new AppError("WABA offline", 500);
//     }

//     try {
//       // Monta a URL da API
//       const url = `https://graph.facebook.com/v${whatsapp?.wabaVersion}/${
//         whatsapp.bmToken || ""
//       }/${phone_number_id}/messages?access_token=${whatsapp.access_tok || ""}`;

//       // Headers
//       const headers = { "Content-Type": "application/json" };

//       // Corpo da mensagem
//       const payload: any = {
//         messaging_product: "whatsapp",
//         to: from,
//         type: "template",
//         template: {
//           name: templateName,
//           language: { code: language },
//           components: [],
//         },
//       };

//       // Adiciona componentes da mensagem se existirem
//       if (components) {
//         for (const comp of components) {
//           if (
//             comp.type === "BUTTON" ||
//             comp.type === "LINK" ||
//             comp.type === "IMAGE"
//           ) {
//             let templateComp: any = {};

//             if (
//               comp.type === "BUTTON" ||
//               comp.type === "LINK" ||
//               comp.type === "IMAGE"
//             ) {
//               templateComp = {
//                 type: comp.type.toLowerCase(),
//                 [comp.type.toLowerCase()]: { link: comp.value },
//               };
//             } else if (comp.type === "TEXT") {
//               templateComp = { type: "text", text: comp.value };
//             }

//             payload.template.components.push({
//               type: "body",
//               parameters: [templateComp],
//             });
//           } else if (comp.type === "TEXT") {
//             const textComponents = comp.value.map((text: string) => ({
//               type: "text",
//               text,
//             }));
//             payload.template.components.push({
//               type: "body",
//               parameters: textComponents,
//             });
//           }
//         }
//       }

//       // Envia a requisição
//       const response = await axios.post(url, payload, { headers });

//       const now = Date.now();

//       const lastMessage = {
//         messageId: response.data.messages?.[0]?.id || "",
//         ticketId: ticket.id,
//         contactId: ticket.contact.id,
//         body: message || "",
//         fromMe: true,
//         mediaType: "template",
//         read: true,
//         ack: 2,
//         timestamp: now,
//         status: "sended",
//       };

//       // Atualiza ticket
//       const ticketDb = await Ticket.findOne({ where: { id: ticket.id } });
//       if (!ticketDb) return;
//       await ticketDb.update({
//         lastMessage: lastMessage.body,
//         lastMessageAt: new Date(),
//         answered: response.data.messages?.[0] || false,
//       });

//       // Atualiza message
//       const messageDb = await Message.findOne({
//         where: { id: idFront, tenantId },
//       });
//       if (!messageDb) return;

//       const newMessageData = {
//         messageId: response.data.messages?.[0]?.id,
//         mediaType: "template",
//         ack: 2,
//         status: "sended" as "sended",
//       };
//       await messageDb.update(newMessageData);

//       // Envia eventos via socket
//       socketEmit({ tenantId, type: "ticket:update", payload: ticketDb });
//       // socketEmit({ tenantId, type: "message", message: messageDb });

//       return response.data.messages;
//     } catch (error) {
//       logger.warn("Erro ao enviar template");
//       throw error;
//     }
//   }
// }

// export { SendTemplateMessageComponents };
