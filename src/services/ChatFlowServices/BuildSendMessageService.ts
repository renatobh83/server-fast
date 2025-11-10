import { join } from "node:path";
import socketEmit from "../../helpers/socketEmit";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { pupa } from "../../utils/pupa";
import { actionsChatFlow } from "./Helpers/Interno/actionsChatFlow";
import { v4 as uuidV4 } from "uuid";
import GetIntegracao from "../../helpers/GetIntegracao";
import { actionsIntegracaoGenesis } from "../IntegracoesServices/Genesis/actionsIntegracaoGenesis";
import SendMessageSystemProxy from "../../helpers/SendMessageSystemProxy";

import { AppError } from "../../errors/errors.helper";
import { SendTbotAppMessageList } from "../WbotServices/SendTbotAppMessageList";
import { SendWhatsMessageList } from "../WbotServices/SendWhatsAppMessageList";

export interface MessageData {
  id?: string;
  ticketId?: number;
  body?: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  timestamp?: number;
  internalId?: string;
  userId?: number;
  tenantId?: number;
  quotedMsgId?: string;
  // status?: string;
  scheduleDate?: Date;
  sendType?: string;
  status?: string;
}

interface WebhookProps {
  apiId: string;
  acao: string;
}
export enum MessageType {
  MessageField = "MessageField",
  MessageOptionsField = "MessageOptionsField",
  MediaField = "MediaField",
  WebhookField = "WebhookField",
}
interface MessageRequest {
  data: {
    message?: any;
    values?: string[];
    caption?: string;
    ext?: string;
    mediaUrl?: string;
    name?: string;
    type?: string;
    webhook?: WebhookProps;
  };
  id: string;
  type: "MessageField" | "MessageOptionsField" | "MediaField" | "WebhookField";
}

interface Request {
  msg: MessageRequest;
  tenantId: number;
  ticket: any;
  userId?: number;
}

const BuildSendMessageService = async ({
  msg,
  tenantId,
  ticket,
  userId,
}: Request): Promise<void> => {
  try {
    const messageData: MessageData = {
      ticketId: ticket.id,
      body: "",
      contactId: ticket.contactId,
      fromMe: true,
      read: true,
      mediaType: "chat",
      mediaUrl: undefined,
      timestamp: new Date().getTime(),
      quotedMsgId: undefined,
      userId,
      scheduleDate: undefined,
      sendType: "bot",
      status: "pending",
      tenantId,
    };
    const modelAttributes = Object.keys(Message.rawAttributes);

    const filterValidAttributes = (data: any) => {
      return Object.fromEntries(
        Object.entries(data).filter(([key]) => modelAttributes.includes(key))
      );
    };

    if (msg.type === "MediaField" && msg.data.mediaUrl) {
      // Verifica se o caminho contém ":\", indicando um caminho absoluto do Windows
      const isAbsolutePath =
        msg.data.mediaUrl.includes(":\\") || msg.data.mediaUrl.includes(":/");

      const urlSplit = isAbsolutePath
        ? msg.data.mediaUrl.split("\\")
        : msg.data.mediaUrl.split("/");

      const message = {
        ticketId: ticket.id,
        contactId: ticket.contactId,
        fromMe: true,
        read: true,
        timestamp: new Date().getTime(),
        quotedMsgId: undefined,
        userId,
        scheduleDate: undefined,
        sendType: "bot",
        status: "pending",
        tenantId,
        body: msg.data.name,
        mediaName: urlSplit[urlSplit.length - 1],
        mediaUrl: urlSplit[urlSplit.length - 1],
        mediaType: msg.data.message.mediaType
          ? msg.data.message.mediaType
          : "chat",
      };

      const customPath = join(__dirname, "..", "..", "..", "public");
      const mediaPath = join(customPath, message.mediaUrl);

      const media = {
        path: mediaPath,
        filename: message.mediaName,
      };

      const messageSent = await SendMessageSystemProxy({
        ticket,
        messageData: message,
        media,
        userId,
      });
      let rawMessageId = messageSent?.id ?? messageSent?.messageId ?? "";
      const messageId = rawMessageId != null ? String(rawMessageId) : "";
      const [existingMessage, created] = await Message.findOrCreate({
        where: {
          messageId,
        },
        defaults: filterValidAttributes({
          ticketId: ticket.id,
          contactId: ticket.contactId,
          fromMe: true,
          read: true,
          timestamp: new Date().getTime(),
          userId,
          scheduleDate: undefined,
          sendType: "bot",
          status: "pending",
          tenantId,
          body: msg.data.name,
          mediaName: urlSplit[urlSplit.length - 1],
          mediaUrl: urlSplit[urlSplit.length - 1],
          mediaType: msg.data.type
            ? msg.data?.type.substr(0, msg.data.type.indexOf("/"))
            : "chat",
          ...messageSent,
          id: messageId ?? uuidV4(),
          messageId: messageId,
        }),
      });

      const messageCreated = await Message.findByPk(existingMessage.id, {
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
        ],
      });

      if (!messageCreated) {
        throw new AppError("ERR_CREATING_MESSAGE_SYSTEM", 422);
      }

      await ticket.update({
        lastMessage:
          Message.decrypt(messageCreated.body).length > 255
            ? Message.decrypt(messageCreated.body).slice(0, 252) + "..."
            : Message.decrypt(messageCreated.body),
        lastMessageAt: new Date().getTime(),
      });

      socketEmit({
        tenantId,
        type: "chat:create",
        payload: messageCreated,
      });
    } else if (msg.type === "WebhookField") {
      let messageSent: any;
      let options: any;
      const integracao = msg.data.webhook?.apiId;
      if (!integracao) {
        options = await actionsChatFlow({
          action: msg.data.webhook?.acao,
          msg,
          tenantId,
          ticket,
        });
      } else {
        const integracaoService = await GetIntegracao(tenantId, integracao);

        if (integracaoService.name.toLocaleLowerCase().trim() === "genesis") {
          options = await actionsIntegracaoGenesis(
            integracaoService,
            ticket,
            msg
          );
        }
      }
      if (!options) return;

      if (typeof options === "object") {
        if (ticket.channel === "telegram") {
          messageSent = await SendTbotAppMessageList({ options, ticket });
        } else {
          messageSent = await SendWhatsMessageList({ options, ticket });
        }
      } else {
        messageSent = await SendMessageSystemProxy({
          ticket,
          messageData: {
            ...messageData,
            body: options,
          },
          media: null,
          userId: null,
        });
      }

      const [existingMessage] = await Message.findOrCreate({
        where: {
          messageId: messageSent.id || messageSent.messageId || null,
        },
        defaults: filterValidAttributes({
          ...messageData,
          ...messageSent,
          id: messageSent.id || messageSent.messageId || uuidV4(),
          messageId: messageSent.id || messageSent.messageId || null,
          mediaType: "bot",
        }),
        ignoreDuplicates: true,
      });

      // Se o registro já existia, atualiza com os novos dados
      if (!existingMessage.isNewRecord) {
        await existingMessage.update(
          filterValidAttributes({
            ...messageData,
            ...messageSent,
            mediaType: "bot",
          })
        );
      }
      const messageCreated = await Message.findByPk(existingMessage.id, {
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
        ],
      });

      if (!messageCreated) {
        throw new AppError("ERR_CREATING_MESSAGE_SYSTEM", 422);
      }

      await ticket.update({
        lastMessage:
          Message.decrypt(messageCreated.body).length > 255
            ? Message.decrypt(messageCreated.body).slice(0, 252) + "..."
            : Message.decrypt(messageCreated.body),
        lastMessageAt: new Date().getTime(),
        answered: true,
      });

      socketEmit({
        tenantId,
        type: "chat:create",
        payload: messageCreated,
      });
    } else {
      // Alter template message

      msg.data.message = pupa(msg.data.message || "", {
        // greeting: será considerado conforme data/hora da mensagem internamente na função pupa
        protocol: ticket.protocol,
        name: ticket.contact.name,
      });

      const messageSent = await SendMessageSystemProxy({
        ticket,
        messageData: {
          ...messageData,
          body: msg.data.message,
        },
        media: null,
        userId: null,
      });
      let rawMessageId = messageSent?.id ?? messageSent?.messageId ?? "";
      const messageId = rawMessageId != null ? String(rawMessageId) : "";
      const [existingMessage, created] = await Message.findOrCreate({
        where: {
          messageId,
        },
        defaults: filterValidAttributes({
          ticketId: ticket.id,
          contactId: ticket.contactId,
          fromMe: true,
          read: true,
          mediaUrl: undefined,
          timestamp: new Date().getTime(),
          quotedMsgId: undefined,
          userId,
          scheduleDate: undefined,
          sendType: "bot",
          status: "pending",
          tenantId,
          ...messageSent,
          id: messageSent?.id ?? messageSent?.messageId ?? uuidV4(),
          messageId: messageSent?.id ?? messageSent?.messageId ?? "",
          mediaType: "bot",
        }),
      });

      if (!created) {
        await existingMessage.update(
          filterValidAttributes({
            contactId: ticket.contactId,
            fromMe: true,
            read: true,
            mediaUrl: undefined,
            timestamp: new Date().getTime(),
            quotedMsgId: undefined,
            userId,
            scheduleDate: undefined,
            sendType: "bot",
            status: "pending",
            tenantId,
            ...messageSent,
            mediaType: "bot",
          })
        );
      }
      const newlyCreatedMessage = await Message.findByPk(existingMessage.id, {
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
        ],
      });

      if (!newlyCreatedMessage) {
        throw new AppError("ERR_CREATING_MESSAGE_SYSTEM", 422);
      }

      await ticket.update({
        lastMessage:
          Message.decrypt(newlyCreatedMessage.body).length > 255
            ? Message.decrypt(newlyCreatedMessage.body).slice(0, 252) + "..."
            : Message.decrypt(newlyCreatedMessage.body),
        lastMessageAt: new Date().getTime(),
        answered: true,
      });

      socketEmit({
        tenantId,
        type: "chat:create",
        payload: newlyCreatedMessage,
      });
    }
  } catch (error: any) {
    console.log(error);
    throw new AppError("ERR_BUILD_SEND_MESSAGE_SERVICE", 502);
  }
};

export default BuildSendMessageService;
