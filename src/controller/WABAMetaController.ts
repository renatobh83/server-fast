// import { FastifyReply } from "fastify";
// import { FastifyRequest } from "fastify/types/request";
// import { STANDARD } from "../constants/request";
// import { AppError, handleServerError } from "../errors/errors.helper";
// import Whatsapp from "../models/Whatsapp";
// import { GetWABAMetaTemplateService } from "../services/WABAMetaServices/GetWABAMetaTemplateService";
// import ShowTicketService from "../services/TicketServices/ShowTicketService";
// import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
// import { CreateMessageSystemService } from "../services/MessageServices/CreateMessageSystemService";
// import { SendTemplateMessageComponents } from "../services/WABAMetaServices/SendWABAMetaTemplateService";

// function substituteVariables(template: any, variables: any[]) {
//   let result = template;

//   variables.forEach((value: any, index: number) => {
//     const placeholder = `{{${index + 1}}}`;
//     result = result.replace(placeholder, value);
//   });

//   return result;
// }

// export const showTemplate = async (
//   request: FastifyRequest,
//   reply: FastifyReply
// ) => {
//   try {
//     const { tenantId } = request.user as any;
//     const { tokenApi } = request.params as any;
//     const query = {
//       tokenAPI: tokenApi,
//       tenantId: tenantId,
//     };

//     const whatsappInstance = await Whatsapp.findOne({ where: query });
//     if (!whatsappInstance) {
//       throw new AppError("ERR_WHATSAPP_TENANTID", 400);
//     }

//     const templateService = GetWABAMetaTemplateService();

//     const templates = await templateService.getTemplate({
//       whatsapp: whatsappInstance,
//     });

//     return reply.code(STANDARD.OK.statusCode).send(templates);
//   } catch (error) {
//     return handleServerError(reply, error);
//   }
// };

// export const sendTemplateMessageComponents = async (
//   request: FastifyRequest,
//   reply: FastifyReply
// ) => {
//   const { tenantId, id: userId } = request.user as any;
//   const {
//     tokenApi,
//     from,
//     ticketId,
//     templateName,
//     language,
//     components,
//     message,
//     idFront,
//   } = request.body as any;
//   const messageData = request.body as any;

//   try {
//     const query = {
//       tokenAPI: tokenApi,
//       tenantId: tenantId,
//     };

//     const whatsappInstance = await Whatsapp.findOne({ where: query });
//     if (!whatsappInstance) {
//       throw new AppError("ERR_WHATSAPP_TENANTID", 400);
//     }
//     // Busca o ticket
//     const ticket = await ShowTicketService({ id: ticketId, tenantId });

//     await SetTicketMessagesAsRead(ticket);

//     // Cria mensagem no sistema com status pendente
//     await CreateMessageSystemService({
//       message: messageData,
//       tenantId,
//       ticket,
//       userId,
//       status: "pending",
//     });
//     const parsedTemplate = JSON.parse(messageData.template);
//     const bodyComponent = components.find(
//       (c: { type: string }) => c.type === "body"
//     );
//     if (bodyComponent && bodyComponent.parameters) {
//       const bodyTemplate = parsedTemplate.find(
//         (c: { type: string }) => c.type === "body"
//       );
//       if (bodyTemplate && bodyTemplate.text) {
//         // Substitui variáveis {{1}}, {{2}}, etc.
//         bodyTemplate.text = substituteVariables(
//           bodyTemplate.text,
//           bodyComponent.parameters
//         );
//       }
//     }
//     // Atualiza o template com os valores substituídos
//     messageData.template = JSON.stringify(parsedTemplate);
//     await CreateMessageSystemService({
//       message: messageData,
//       tenantId,
//       ticket,
//       userId,
//       status: "pending",
//     });
//     const sender = new SendTemplateMessageComponents();
//     const result = await sender.send({
//       from,
//       tokenApi,
//       template: messageData.template,
//       ticket,
//       tenantId,
//       remoteJid: messageData.remoteJid,
//       whatsapp,
//       messageTimestamp: messageData.messageTimestamp,
//       remoteName: messageData.remoteName,
//       components,
//     });
//     return reply.code(STANDARD.OK.statusCode).send();
//   } catch (error) {
//     return handleServerError(reply, error);
//   }
// };
