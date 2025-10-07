import { FastifyRequest, FastifyReply } from "fastify";
import ListMessagesService from "../services/MessageServices/ListMessagesService";
import { handleServerError } from "../errors/errors.helper";
import { STANDARD } from "../constants/request";
import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { Message } from "wbotconnect";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import { CreateMessageSystemService } from "../services/MessageServices/CreateMessageSystemService";
import CreateForwardMessageService from "../services/MessageServices/CreateForwardMessageService";

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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
    return handleServerError(reply, error);
  }
};
