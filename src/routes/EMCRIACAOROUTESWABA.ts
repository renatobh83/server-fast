// "use strict";

// const express = require("express");
// const multer = require("multer");
// const uploadConfig = require("../config/uploadZPRO");
// const isAuth = require("../middleware/isAuthZPRO");
// const WABAMetaController = require("../controllers/WABAMetaControllerZPRO");

// const router = express.Router();
// const upload = multer(uploadConfig);

// // 📄 GET: Buscar templates disponíveis
// router.get(
//   "/wabametaTemplate/:tokenApi",
//   isAuth,
//   WABAMetaController.showTemplate
// );

// // 📨 POST: Enviar template simples
// router.post(
//   "/wabametaTemplateText/",
//   isAuth,
//   WABAMetaController.sendTemplateMessage
// );

// // 🧩 POST: Enviar template com componentes
// router.post(
//   "/wabametaTemplateComponents/",
//   isAuth,
//   WABAMetaController.sendTemplateMessageComponents
// );

// // 📦 POST: Enviar template em massa com componentes
// router.post(
//   "/wabametaBulkTemplateComponents/",
//   isAuth,
//   WABAMetaController.sendBulkTemplateMessageComponents
// );

// // ⏰ POST: Agendar envio de template
// router.post(
//   "/wabametaTemplateTextSchedule/",
//   isAuth,
//   WABAMetaController.sendTemplateMessageSchedule
// );

// // 📞 POST: Verificar número de telefone
// router.post("/wabametaVerifyPhone/", isAuth, WABAMetaController.verifyPhone);

// // 💬 POST: Enviar mensagem de texto
// router.post("/wabametaText/", isAuth, WABAMetaController.sendMessage);

// // 🔘 POST: Enviar mensagem com botão
// router.post("/wabametaButton/", isAuth, WABAMetaController.sendButton);

// // 📋 POST: Enviar mensagem com lista
// router.post("/wabametaList/", isAuth, WABAMetaController.sendList);

// // 📁 POST: Enviar arquivo via upload
// router.post(
//   "/wabametaFile/",
//   isAuth,
//   upload.array("medias"),
//   WABAMetaController.sendFile
// );

// // 🧷 POST: Enviar figurinha via upload
// router.post(
//   "/wabametaSticker/",
//   isAuth,
//   upload.array("medias"),
//   WABAMetaController.sendSticker
// );

// // 🌐 POST: Enviar arquivo via URL
// router.post("/wabametaFileUrl/", isAuth, WABAMetaController.sendFileUrl);

// module.exports = router;

// // Controller

// const showTemplate = async (req, res) => {
//   const { tenantId } = req.user;
//   const { tokenApi } = req.params;

//   const query = {
//     tokenAPI: tokenApi,
//     tenantId: tenantId,
//   };

//   const whatsappInstance = await WhatsappZPRO.findOne({ where: query });

//   if (!whatsappInstance) {
//     throw new AppErrorZPRO('ERR_WHATSAPP_TENANTID', 400);
//   }

//   const templateService = new GetWABAMetaTemplateServiceZPRO();
//   const templates = await templateService.getTemplate({ whatsapp: whatsappInstance });

//   return res.status(200).json(templates);
// };

// exports.showTemplate = showTemplate;

// GetWABAMetaTemplateServiceZPRO {
// class GetTemplate {
//   getTemplate({ whatsapp }) {
//     return (async () => {
//       try {
//         const url = `https://graph.facebook.com/v${whatsapp?.wabaVersion}/${whatsapp?.wabaId}/message_templates`;

//         const response = await axios({
//           method: 'GET',
//           url,
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${whatsapp?.bmToken}`,
//           },
//         });

//         return response.data;
//       } catch (error) {
//         logger.warn('::: Z-PRO ::: ZDG ::: WABA get template error');
//         throw error;
//       }
//     })();
//   }
// }
// }

// const sendTemplateMessage = async (req, res) => {
//   const { tokenApi, from, ticketId, templateName, language, components } = req.body;
//   const { tenantId, id: userId } = req.user;

//   try {
//     // Busca instância do WhatsApp vinculada ao tenant e token
//     const whatsappInstance = await WhatsappZPRO.findOne({
//       where: { tokenAPI: tokenApi, tenantId },
//     });

//     if (!whatsappInstance) {
//       throw new AppErrorZPRO('ERR_WHATSAPP_TENANTID', 400);
//     }

//     // Busca ticket
//     const ticket = await ShowTicketServiceZPRO({ id: ticketId, tenantId });

//     // Marca mensagens como lidas
//     await SetTicketMessagesAsReadZPRO(ticket);

//     // Cria mensagem no sistema
//     await CreateMessageSystemServiceZPRO({
//       msg: req.body,
//       tenantId,
//       ticket,
//       userId,
//       sendType: 'template',
//       status: 'pending',
//     });

//     // Envia template via serviço
//     const templateService = new SendWABAMetaTemplateServiceZPRO();
//     const result = await templateService.sendTemplate({
//       from,
//       phone_number_id: tokenApi,
//       templateName,
//       language,
//       components,
//       ticket,
//       tenantId,
//       whatsapp: whatsappInstance,
//     });

//     return res.status(200).json(result);
//   } catch (error) {
//     loggerZPRO.logger.warn('::: Z-PRO ::: ZDG ::: Error sending template message:', error);
//     return res.status(500).json({ error: 'Failed to send template message' });
//   }
// };

// 'use strict';

// const axios = require('axios');
// const Ticket = require('../../models/TicketZPRO');
// const Message = require('../../models/MessageZPRO');
// const socketEmit = require('../../helpers/socketEmitZPRO');
// const AppError = require('../../errors/AppErrorZPRO');
// const { logger } = require('../../utils/loggerZPRO');

// class SendTemplateMessageComponents {
//   async sendTemplateMessageComponents({
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
//   }) {
//     if (whatsapp.status !== 'CONNECTED') {
//       throw new AppError('ERR_WHATSAPP_OFFLINE', 400);
//     }

//     try {
//       const url = `https://graph.facebook.com/v${whatsapp?.wabaVersion}/${phone_number_id}/messages?access_token=${whatsapp?.bmToken}`;

//       const templatePayload = {
//         messaging_product: 'whatsapp',
//         to: from,
//         type: 'template',
//         template: {
//           name: templateName,
//           language: { code: language },
//           components: [],
//         },
//       };

//       // Monta os componentes do template
//       if (components) {
//         for (const component of components) {
//           if (component.type === 'HEADER') {
//             let headerParam = {};

//             if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(component.format)) {
//               headerParam = {
//                 type: component.format.toLowerCase(),
//                 [component.format.toLowerCase()]: { link: component.value },
//               };
//             } else if (component.format === 'TEXT') {
//               headerParam = {
//                 type: 'text',
//                 text: component.value,
//               };
//             }

//             templatePayload.template.components.push({
//               type: 'header',
//               parameters: [headerParam],
//             });
//           }

//           if (component.type === 'BODY') {
//             const bodyParams = component.variables.map((text) => ({
//               type: 'text',
//               text,
//             }));

//             templatePayload.template.components.push({
//               type: 'body',
//               parameters: bodyParams,
//             });
//           }
//         }
//       }

//       // Envia a mensagem via API do WhatsApp
//       const response = await axios({
//         method: 'POST',
//         url,
//         data: templatePayload,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       const timestamp = Date.now();
//       const messageData = {
//         messageId: response.data.messages[0].id || '',
//         ticketId: ticket.id,
//         contactId: ticket.contact.id,
//         body: message || '',
//         fromMe: true,
//         mediaType: 'templates',
//         read: true,
//         ack: 2,
//         timestamp,
//         status: 'sended',
//       };

//       // Atualiza o ticket
//       const ticketRecord = await Ticket.findOne({ where: { id: ticket.id } });
//       if (!ticketRecord) return;

//       await ticketRecord.update({
//         lastMessage: messageData.body,
//         lastMessageAt: Date.now(),
//         answered: response.data.fromMe || false,
//       });

//       // Atualiza a mensagem no sistema
//       const messageRecord = await Message.findOne({
//         where: { idFront, tenantId },
//       });
//       if (!messageRecord) return;

//       await messageRecord.update({
//         messageId: response.data.messages[0].id,
//         mediaType: 'templates',
//         ack: 2,
//         status: 'sended',
//       });

//       // Emite atualização via socket
//       socketEmit({
//         tenantId,
//         type: 'ticket:update',
//         payload: ticket,
//       });

//       // Emite confirmação de envio
//       const ackMessage = await Message.findOne({
//         where: {
//           messageId: response.data.messages[0].id,
//           tenantId,
//         },
//       });

//       if (!ackMessage) return;

//       socketEmit({
//         tenantId,
//         type: 'chat:ack',
//         payload: ackMessage,
//       });

//       return response.data;
//     } catch (error) {
//       logger.warn('::: Z-PRO ::: ZDG ::: WABA send template error');
//       throw error;
//     }
//   }
// }

// module.exports = SendTemplateMessageComponents;

// const sendTemplateMessage = async (req, res) => {
//   const { tokenApi, from, ticketId, templateName, language, components } = req.body;
//   const { tenantId, id: userId } = req.user;

//   try {
//     // Busca a instância do WhatsApp vinculada ao tenant e token
//     const whatsapp = await WhatsappZPRO.findOne({
//       where: { tokenAPI: tokenApi, tenantId },
//     });

//     if (!whatsapp) {
//       throw new AppErrorZPRO('ERR_WHATSAPP_TENANTID', 400);
//     }

//     // Busca o ticket
//     const ticket = await ShowTicketServiceZPRO({ id: ticketId, tenantId });

//     // Marca mensagens como lidas
//     await SetTicketMessagesAsReadZPRO(ticket);

//     // Cria uma mensagem no sistema com status pendente
//     await CreateMessageSystemServiceZPRO({
//       msg: req.body,
//       tenantId,
//       ticket,
//       userId,
//       sendType: 'template',
//       status: 'pending',
//     });

//     // Envia o template via serviço
//     const templateService = new SendWABAMetaTemplateServiceZPRO();
//     const result = await templateService.sendTemplate({
//       from,
//       phone_number_id: tokenApi,
//       templateName,
//       language,
//       components,
//       ticket,
//       tenantId,
//       whatsapp,
//     });

//     return res.status(200).json(result);
//   } catch (error) {
//     loggerZPRO.logger.warn('::: Z-PRO ::: ZDG ::: Error sending template message:', error);
//     return res.status(500).json({ error: 'Failed to send template message' });
//   }
// };

// const sendMessage = async (req, res) => {
//   const { tokenApi, from, ticketId, message } = req.body;
//   const { tenantId, id: userId } = req.user;

//   try {
//     // Busca instância do WhatsApp vinculada ao tenant e token
//     const whatsapp = await WhatsappZPRO.findOne({
//       where: { tokenAPI: tokenApi, tenantId },
//     });

//     if (!whatsapp) {
//       throw new AppErrorZPRO('ERR_WHATSAPP_TENANTID', 400);
//     }

//     // Busca o ticket
//     const ticket = await ShowTicketServiceZPRO({ id: ticketId, tenantId });

//     // Marca mensagens como lidas
//     await SetTicketMessagesAsReadZPRO(ticket);

//     // Cria mensagem no sistema com status pendente
//     await CreateMessageSystemServiceZPRO({
//       msg: req.body,
//       tenantId,
//       ticket,
//       userId,
//       sendType: 'text',
//       status: 'pending',
//     });

//     // Envia mensagem via serviço
//     const messageService = new SendWABAMetaTextServiceZPRO();
//     const result = await messageService.sendText({
//       from,
//       phone_number_id: tokenApi,
//       message,
//       ticket,
//       tenantId,
//       whatsapp,
//     });

//     return res.status(200).json(result);
//   } catch (error) {
//     loggerZPRO.logger.warn('::: Z-PRO ::: ZDG ::: Error sending text message:', error);
//     return res.status(500).json({ error: 'Failed to send text message' });
//   }
// };

// 'use strict';

// const axios = require('axios');
// const Ticket = require('../../models/TicketZPRO');
// const Message = require('../../models/MessageZPRO');
// const socketEmit = require('../../helpers/socketEmitZPRO');
// const AppError = require('../../errors/AppErrorZPRO');
// const { logger } = require('../../utils/loggerZPRO');

// class SendTemplateMessage {
//   async sendTemplateMessage({
//     from,
//     phone_number_id,
//     message,
//     ticket,
//     tenantId,
//     idFront,
//     whatsapp,
//     language,
//     templateName,
//   }) {
//     if (whatsapp.status !== 'CONNECTED') {
//       throw new AppError('ERR_WHATSAPP_OFFLINE', 400);
//     }

//     try {
//       const url = `https://graph.facebook.com/v${whatsapp?.wabaVersion}/${phone_number_id}/messages?access_token=${whatsapp?.bmToken}`;

//       const templatePayload = {
//         messaging_product: 'whatsapp',
//         to: from,
//         type: 'template',
//         template: {
//           name: templateName,
//           language: { code: language },
//         },
//       };

//       const response = await axios({
//         method: 'POST',
//         url,
//         data: templatePayload,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       const timestamp = Date.now();
//       const messageData = {
//         messageId: response.data.messages[0].id || '',
//         ticketId: ticket.id,
//         contactId: ticket.contact.id,
//         body: message || '',
//         fromMe: true,
//         mediaType: 'templates',
//         read: true,
//         ack: 2,
//         timestamp,
//         status: 'sended',
//       };

//       // Atualiza o ticket
//       const ticketRecord = await Ticket.findOne({ where: { id: ticket.id } });
//       if (!ticketRecord) return;

//       await ticketRecord.update({
//         lastMessage: messageData.body,
//         lastMessageAt: Date.now(),
//         answered: response.data.fromMe || false,
//       });

//       // Atualiza a mensagem no sistema
//       const messageRecord = await Message.findOne({
//         where: { idFront, tenantId },
//       });
//       if (!messageRecord) return;

//       await messageRecord.update({
//         messageId: response.data.messages[0].id,
//         mediaType: 'templates',
//         ack: 2,
//         status: 'sended',
//       });

//       // Emite atualização via socket
//       socketEmit({
//         tenantId,
//         type: 'ticket:update',
//         payload: ticket,
//       });

//       // Emite confirmação de envio
//       const ackMessage = await Message.findOne({
//         where: {
//           messageId: response.data.messages[0].id,
//           tenantId,
//         },
//       });

//       if (!ackMessage) return;

//       socketEmit({
//         tenantId,
//         type: 'chat:ack',
//         payload: ackMessage,
//       });

//       return response.data;
//     } catch (error) {
//       logger.warn('::: Z-PRO ::: ZDG ::: WABA send template error');
//       throw error;
//     }
//   }
// }

// module.exports = SendTemplateMessage;
