import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";

import { v4 as uuidv4 } from "uuid";
import { pupa } from "../../utils/pupa";

import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import SendMessageSystemProxy from "../../helpers/SendMessageSystemProxy";
import socketEmit from "../../helpers/socketEmit";
import { detectMediaType } from "../../utils/detectMediaType";

interface MessageRequest {
  body: string;
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
  sendType?: string;
  scheduleDate?: string;
}

interface Request {
  message: MessageRequest | any;
  status: string;
  tenantId: string | number;
  filesArray?: any[] | [];
  ticket: Ticket;
  userId?: number | string;
}
export const CreateMessageSystemService = async ({
  message,
  status,
  tenantId,
  ticket,
  filesArray,
  userId,
}: Request) => {
  try {
    const decryptedMessage = getDecryptedMessage(message);

    const messageData = {
      ticketId: ticket.id,
      body: decryptedMessage,
      contactId: ticket.contactId,
      fromMe: message.fromMe,
      read: true,
      mediaType: "chat",
      mediaUrl: "",
      mediaName: undefined,
      timestamp: Date.now(),
      quotedMsgId: message.quotedMsg?.messageId,
      quotedMsg: message.quotedMsg,
      userId,
      scheduleDate: message.scheduleDate,
      sendType: message.sendType,
      status,
      tenantId,
      idFront: message.idFront,
      buffer: undefined,
    };
    if (decryptedMessage && !Array.isArray(decryptedMessage)) {
      messageData.body = buildMessageBody(decryptedMessage, ticket);
    }
    const modelAttributes = Object.keys(Message.rawAttributes);

    const filterValidAttributes = (data: any) => {
      return Object.fromEntries(
        Object.entries(data).filter(([key]) => modelAttributes.includes(key))
      );
    };

    await Promise.all(
      (filesArray && filesArray.length ? filesArray : [null]).map(
        async (media) => {
          if (!media) {
            messageData.mediaType = "chat";
            messageData.mediaName = undefined;
            messageData.buffer = undefined;
          } else {
            messageData.mediaType = detectMediaType(media.mimetype);
            messageData.mediaName = media.filename;
            messageData.buffer = media.buffer;

            const filepath = `./public/${media.filename}`;
            messageData.mediaUrl = filepath;
            const readable = Readable.from(media.buffer);
            await pipeline(readable, createWriteStream(filepath));
          }

          const messageSent = await SendMessageSystemProxy({
            ticket,
            messageData,
            media,
            userId,
          });

          // if (ticket.channel === "whatsapp") return;

          const [msgCreated, created] = await Message.findOrCreate({
            where: {
              messageId:
                String(messageSent.id) || messageSent.messageId || null,
              tenantId,
            },
            defaults: filterValidAttributes({
              ...messageData,
              ...messageSent,
              id: messageSent.id || messageSent.messageId || uuidv4(),
              userId,
              tenantId,
              body: media?.originalname || messageData.body,
              mediaUrl: media?.filename,
              mediaType:
                media && media.mimetype
                  ? detectMediaType(media.mimetype)
                  : "chat",
            }),
          });

          if (created) {
            const reloadedMessage = await Message.findByPk(msgCreated.id, {
              include: [
                {
                  model: Ticket,
                  as: "ticket",
                  where: { tenantId },
                  include: ["contact"],
                },
                {
                  model: Message,
                  as: "quotedMsg",
                  include: ["contact"],
                },
                {
                  model: Contact,
                  as: "contact",
                },
              ],
            });

            if (!reloadedMessage) {
              // Isso é um caso improvável, mas é bom ter uma verificação.
              throw new AppError("ERR_RELOAD_MESSAGE", 501);
            }
            socketEmit({
              tenantId,
              type: "chat:create",
              payload: reloadedMessage,
            });
          } else {
            socketEmit({
              tenantId,
              type: "chat:create",
              payload: msgCreated,
            });
          }
        }
      )
    );
  } catch (error) {
    console.log(error);
    throw new AppError("ERR_CREATING_MESSAGE", 501);
  }
};

function getDecryptedMessage(msg?: { body?: string }) {
  if (!msg?.body) return "";
  return isEncrypted(msg.body) ? Message.decrypt(msg.body) : msg.body;
}

export const isEncrypted = (message: string) => {
  if (typeof message !== "string") return false;

  const parts = message.split(":");
  if (parts.length !== 2) return false; // Deve conter IV e mensagem

  const ivHex = parts[0];
  const encryptedData = parts[1];

  // Verifica se o IV tem 32 caracteres e é um valor hexadecimal válido
  return /^[0-9A-Fa-f]{32}$/.test(ivHex) && encryptedData.length > 0;
};

const buildMessageBody = (template: string, ticket: Ticket) => {
  return pupa(template || "", {
    protocol: ticket?.protocol ?? "",
    name: ticket?.contact?.name ?? "",
    email: ticket?.contact?.email ?? "",
    phoneNumber: ticket?.contact?.number ?? "",
    user: ticket?.user?.name ?? "",
    userEmail: ticket?.user?.email ?? "",
  });
};
