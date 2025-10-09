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
    ...msg,
    messageId: msg.id,
    ticketId: ticket.id,
    contactId,
    body: msg.caption || filename,
    read: msg.fromMe,
    mediaUrl: filename,
    mediaType: msg.mimetype.split("/")[0],
    quotedMsgId: quotedMsg?.messageId,
    status: msg.fromMe ? "sended" : "received",
    isForwarded: msg.isForwarded,
  };

  await ticket.update({
    lastMessage: msg.caption || filename,
    lastMessageAt: Date.now(),
    answered: !!msg.fromMe,
  });

  return await CreateMessageService({
    messageData,
    tenantId: ticket.tenantId,
  });
};

export default VerifyMediaMessage;
