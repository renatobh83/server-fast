import { FastifyRequest, FastifyReply } from "fastify";
import ListMessagesService from "../services/MessageServices/ListMessagesService";
import { handleServerError } from "../errors/errors.helper";
import { STANDARD } from "../constants/request";
import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { Message } from "wbotconnect";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import { CreateMessageSystemService } from "../services/MessageServices/CreateMessageSystemService";
import CreateForwardMessageService from "../services/MessageServices/CreateForwardMessageService";
import { startTypingWbot } from "../services/WbotServices/StartTypingWbot";
import { stopTypingWbot } from "../services/WbotServices/StopTypingWbot";
import { getWbot } from "../lib/wbot";
import modelMessage from "../models/Message";
import { SendReactionMessage } from "../services/WbotServices/Helpers/SendReactionMessage";
import { logger } from "../utils/logger";

type IndexQuery = {
  pageNumber: string;
};

export const listMessages = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  const { ticketId } = request.params as any;
  const { pageNumber } = request.query as IndexQuery;
  try {
    const { count, messages, ticket, hasMore } = await ListMessagesService({
      tenantId,
      ticketId,
      pageNumber,
    });
    SetTicketMessagesAsRead(ticket);
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ count, ticket, messages, hasMore });
  } catch (error) {
    logger.error("Error in listMessages", error);
    return handleServerError(reply, error);
  }
};

export const createMessages = async (
  request: FastifyRequest<{
    Body: {
      body: string;
      fromMe: boolean;
      read: boolean;
      sendType?: string;
      scheduleDate?: string | Date;
      quotedMsg?: Message;
      idFront?: string;
    };
  }>,
  reply: FastifyReply
) => {
  const { tenantId, id } = request.user as any;
  const { ticketId } = request.params as any;
  let filesArray: any[] = [];
  let fields: Record<string, any> = {};

  if (request.isMultipart()) {
    const parts = request.parts();

    for await (const part of parts) {
      if (part.type === "file") {
        const buffer = await part.toBuffer();
        filesArray.push({
          filename: part.filename,
          mimetype: part.mimetype,
          buffer,
        });
      } else {
        fields[part.fieldname] = part.value;
      }
    }
  } else {
    fields = request.body as any;
  }
  try {
    const ticket = await ShowTicketService({ id: ticketId, tenantId });

    await SetTicketMessagesAsRead(ticket);

    const messageData = {
      message: fields,
      filesArray,
      tenantId,
      ticket,
      userId: id,
      status: "pending",
    };

    await CreateMessageSystemService(messageData);
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "messagem enviada" });
  } catch (error) {
    logger.error("Error in createMessages", error);
    return handleServerError(reply, error);
  }
};

export const forward = async (
  request: FastifyRequest<{
    Body: {
      messages: any[];
      contact: any;
    };
  }>,
  reply: FastifyReply
) => {
  const { contact, messages } = request.body;
  const { id, tenantId } = request.user as any;

  try {
    for (const message of messages) {
      await CreateForwardMessageService({
        userId: id,
        tenantId: tenantId,
        message,
        contact,
        ticketIdOrigin: message.ticketId,
      });
    }

    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "messagem enviada" });
  } catch (error) {
    logger.error("Error in forwardMessages", error);
    return handleServerError(reply, error);
  }
};

export const startTyping = async (
  request: FastifyRequest<{
    Body: {
      messages: any[];
      contact: any;
    };
  }>,
  reply: FastifyReply
) => {
  const { ticketId } = request.params as any;
  try {
    await startTypingWbot(ticketId);
    return reply.code(STANDARD.OK.statusCode).send({ message: "stratTyping" });
  } catch (error) {
    logger.error("Error in startTyping", error);
    return reply.code(STANDARD.OK.statusCode).send({ message: "stratTyping" });
  }
};

export const stopTyping = async (
  request: FastifyRequest<{
    Body: {
      messages: any[];
      contact: any;
    };
  }>,
  reply: FastifyReply
) => {
  const { ticketId } = request.params as any;
  try {
    await stopTypingWbot(ticketId);
    return reply.code(STANDARD.OK.statusCode).send({ message: "stopTyping" });
  } catch (error) {
    logger.error("Error in stopTyping", error);
    return reply.code(STANDARD.OK.statusCode).send({ message: "stopTyping" });
  }
};

export const messageReaction = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { messageid, emoji } = request.body as any;
  try {
    await SendReactionMessage(messageid, emoji);
    return reply.code(STANDARD.OK.statusCode).send(true);
  } catch (error) {
    logger.error("Error in messageReaction", error);
    return reply.code(STANDARD.OK.statusCode).send({ message: "sendReaction" });
  }
};
