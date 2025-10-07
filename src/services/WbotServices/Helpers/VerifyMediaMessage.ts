import { writeFile } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import type { Message as WbotMessage, Whatsapp } from "wbotconnect";

import type Contact from "../../../models/Contact";
import Message from "../../../models/Message";
import type Ticket from "../../../models/Ticket";
import { logger } from "../../../utils/logger";
import VerifyQuotedMessage from "./VerifyQuotedMessage";
import CreateMessageService from "../../MessageServices/CreateMessageService";

const writeFileAsync = promisify(writeFile);

const VerifyMediaMessage = async (
  msg: WbotMessage,
  ticket: Ticket,
  contact: Contact,
  wbot: Whatsapp,
  authorGroupMessage?: string
): Promise<Message | void> => {
  const quotedMsg = await VerifyQuotedMessage(msg);

  // Baixar e tratar mídia
  const media = await wbot.downloadMedia(msg);
  const matches = media.match(/^data:(.+);base64,(.+)$/);
  const base64Data = matches ? matches[2] : media;

  if (!base64Data) {
    logger.error(`ERR_WAPP_DOWNLOAD_MEDIA:: ID: ${msg.id}`);
    return;
  }

  const fileData = Buffer.from(base64Data, "base64");

  let ext = msg.mimetype.split("/")[1].split(";")[0];
  if (ext === "octet-stream" && msg.caption?.includes(".")) {
    ext = msg.caption.split(".").pop()?.trim() ?? "bin";
  }

  const captionName = msg.caption?.trim();
  const filename =
    captionName && captionName.includes(".")
      ? captionName
      : `${Date.now()}.${ext}`;

  try {
    await writeFileAsync(
      join(__dirname, "..", "..", "..", "..", "public", filename),
      fileData
    );
  } catch (err) {
    logger.error("Erro ao salvar mídia:", err);
  }

  // === Regras de contactId (otimizado e legível) ===
  let contactId: number | undefined;

  if (msg.isGroupMsg) {
    if (msg.fromMe) {
      contactId = contact.id; // eu mandei no grupo → meu contato
    } else {
      contactId = authorGroupMessage ? Number(authorGroupMessage) : undefined; // outro participante → id dele
    }
  } else {
    contactId = msg.fromMe ? contact.id : contact.id; // conversa privada → sempre o contato
  }

  const messageData = {
    messageId: msg.id,
    ticketId: ticket.id,
    contactId,
    body: msg.caption || filename,
    fromMe: msg.fromMe,
    read: msg.fromMe,
    mediaUrl: filename,
    mediaType: msg.mimetype.split("/")[0],
    quotedMsgId: quotedMsg?.messageId,
    timestamp: msg.timestamp,
    status: msg.fromMe ? "sended" : "received",
    ack: msg.ack,
    isForwarded: msg.isForwarded,
  };

  await ticket.update({
    lastMessage: msg.caption || filename,
    lastMessageAt: Date.now(),
    answered: !!msg.fromMe,
  });

  // delay opcional (não recomendo usar timeout fixo)
  // await new Promise((r) => setTimeout(r, 300));

  return await CreateMessageService({
    messageData,
    tenantId: ticket.tenantId,
  });
};

export default VerifyMediaMessage;

// import { writeFile } from "node:fs";
// import { join } from "node:path";
// import { promisify } from "node:util";
// import type { Message as WbotMessage, Whatsapp } from "wbotconnect";

// import type Contact from "../../../models/Contact";
// import Message from "../../../models/Message";
// import type Ticket from "../../../models/Ticket";
// import { logger } from "../../../utils/logger";
// import VerifyQuotedMessage from "./VerifyQuotedMessage";
// import CreateMessageService from "../../MessageServices/CreateMessageService";
// import { GetContactByNumber } from "./GetContactByNumber";

// const writeFileAsync = promisify(writeFile);

// const VerifyMediaMessage = async (
//   msg: WbotMessage,
//   ticket: Ticket,
//   contact: Contact,
//   wbot: Whatsapp,
//   authorGrupMessage?: string
// ): Promise<Message | void> => {
//   const quotedMsg = await VerifyQuotedMessage(msg);

//   const media = await wbot.downloadMedia(msg);
//   const matches = media.match(/^data:(.+);base64,(.+)$/);

//   const base64Data = matches ? matches[2] : media;

//   if (!base64Data) {
//     logger.error(`ERR_WAPP_DOWNLOAD_MEDIA:: ID: ${msg.id}`);
//     return;
//   }

//   const fileData = Buffer.from(base64Data, "base64");

//   let ext = msg.mimetype.split("/")[1].split(";")[0];

//   // // Se mimetype for genérico, tenta extrair da legenda
//   if (ext === "octet-stream" && msg.caption && msg.caption.includes(".")) {
//     ext = msg.caption.split(".").pop()?.trim() ?? "bin";
//   }
//   const captionName = msg.caption?.trim();
//   const filename =
//     captionName && captionName.includes(".")
//       ? captionName
//       : `${new Date().getTime()}.${ext}`;

//   try {
//     await writeFileAsync(
//       join(__dirname, "..", "..", "..", "..", "public", filename),
//       fileData
//     );
//   } catch (err) {
//     logger.error(err);
//   }
//   let authorGroupMsgId: any = authorGrupMessage ? authorGrupMessage : 0;

//   const messageData = {
//     messageId: msg.id,
//     ticketId: ticket.id,
//     contactId: msg.isGroupMsg
//       ? authorGroupMsgId
//       : msg.fromMe
//       ? undefined
//       : contact.id,
//     body: msg.caption || filename,
//     fromMe: msg.fromMe,
//     read: msg.fromMe,
//     mediaUrl: filename,
//     mediaType: msg.mimetype.split("/")[0],
//     quotedMsgId: quotedMsg?.messageId,
//     timestamp: msg.timestamp,
//     status: msg.fromMe ? "sended" : "received",
//     ack: msg.ack,
//   };

//   await ticket.update({
//     lastMessage: msg.id,
//     lastMessageAt: new Date().getTime(),
//     answered: msg.fromMe || false,
//   });

//   await new Promise((r) => setTimeout(r, 600));

//   const newMessage = await CreateMessageService({
//     messageData,
//     tenantId: ticket.tenantId,
//   });

//   return newMessage;
// };

// export default VerifyMediaMessage;
