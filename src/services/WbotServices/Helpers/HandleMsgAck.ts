// import { Ack } from "wbotconnect";
// import { AppError } from "../../../errors/errors.helper";
// import socketEmit from "../../../helpers/socketEmit";
// import Message from "../../../models/Message";
// import Ticket from "../../../models/Ticket";
// import { getId } from "../../../utils/normalize";

// const HandleMsgAck = async (msg: Ack) => {
//   await new Promise((r) => setTimeout(r, 1000));

//   try {
//     const messageToUpdate = await Message.findOne({
//       where: { messageId: getId(msg) },
//       include: [
//         "contact",
//         {
//           model: Ticket,
//           as: "ticket",
//           attributes: ["id", "tenantId", "apiConfig"],
//         },
//         {
//           model: Message,
//           as: "quotedMsg",
//           include: ["contact"],
//         },
//       ],
//     });
//     const ack = msg.ack;

//     if (messageToUpdate) {
//       await messageToUpdate.update({ ack });
//       const { ticket } = messageToUpdate;
//       console.log(ticket);
//       socketEmit({
//         tenantId: ticket.tenantId,
//         type: "chat:update",
//         payload: messageToUpdate,
//       });

//       const apiConfig: any = ticket.apiConfig || {};
//       if (apiConfig?.externalKey && apiConfig?.urlMessageStatus) {
//         const payload = {
//           ack,
//           messageId: getId(msg),
//           ticketId: ticket.id,
//           externalKey: apiConfig?.externalKey,
//           authToken: apiConfig?.authToken,
//           type: "hookMessageStatus",
//         };

//         // addJob("WebHooksAPI", {
//         // 	url: apiConfig.urlMessageStatus,
//         // 	type: payload.type,
//         // 	payload,
//         // });
//       }
//     }

//     // const messageApi = await ApiMessage.findOne({
//     // 	where: { messageId: getId(msg) },
//     // });

//     // if (messageApi) {
//     // 	await messageApi.update({ ack });
//     // }
//   } catch (error: any) {
//     if (error instanceof AppError) {
//       throw error;
//     }
//     throw new AppError("ERR_CREATE_USER_SERICE", 500);
//   }
// };

// export default HandleMsgAck;
