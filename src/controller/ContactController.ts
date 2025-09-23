import { FastifyReply, FastifyRequest } from "fastify";
import { CreateContactService } from "../services/ContactServices/CreateContactService";
import { AppError, handleServerError } from "../errors/errors.helper";
import { STANDARD } from "../constants/request";
import ListContactsService from "../services/ContactServices/ListContactsService";
import UpdateContactService, {
  ContactDataUpdate,
} from "../services/ContactServices/UpdateContactService";
import ShowContactService from "../services/ContactServices/ShowContactService";
import { CheckWappInitialized } from "../services/WbotServices/Helpers/CheckWappInitialized";
import CheckIsValidContact from "../services/WbotServices/Helpers/CheckIsValidContact";
import UpdateContactSocketService from "../services/ContactServices/UpdateContactSocketService";

interface ContactData {
  name: string;
  number: string;
  email?: string;
  dtaniversario?: Date | undefined;
  identifier?: string;
  telegramId?: number;
  isGroup?: boolean;
  empresas?: string;
  profilePicUrl?: any;
  isWAContact?: boolean;
  serializednumber?: string;
  id?: {
    user: string;
  };
}
type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

export const listaContatos = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId, id: userId, profile } = request.user as any;
  const { searchParam, pageNumber } = request.query as IndexQuery;
  try {
    const { contacts, count, hasMore } = await ListContactsService({
      searchParam,
      pageNumber,
      tenantId,
      profile,
      userId,
    });
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ contacts, count, hasMore });
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
export const store = async (
  request: FastifyRequest<{ Body: ContactData }>,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  const newContato = request.body;

  newContato.number = newContato.number.toString();
  try {
    const contact = await CreateContactService({
      ...newContato,
      tenantId,
    });
    return reply.code(STANDARD.OK.statusCode).send(contact);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const updateContato = async (
  request: FastifyRequest<{ Body: ContactDataUpdate }>,
  reply: FastifyReply
) => {
  const { contactId } = request.params as any;
  const { tenantId } = request.user as any;
  const newContato = request.body;

  newContato.number = newContato.number?.toString();
  try {
    const contact = await UpdateContactService({
      contactData: newContato,
      contactId,
      tenantId,
    });
    return reply.code(STANDARD.OK.statusCode).send(contact);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};

export const detalhesContato = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { contactId } = request.params as any;
  const { tenantId } = request.user as any;
  try {
    const contato = await ShowContactService({ id: contactId, tenantId });
    return reply.code(STANDARD.OK.statusCode).send(contato);
  } catch (error) {
    return handleServerError(reply, error);
  }
};

export const updateContatoSocket = async (
  request: FastifyRequest<{
    Body: {
      name: string;
      number: string;
      email: string;
      profilePicUrl: string;
      pushname: string;
      telegramId: number;
      identifier: string;
      serializednumber: string;
      isWAContact: boolean;
      isGroup: boolean;
    };
  }>,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;
  const { contactId: contato } = request.params as any;
  const payload = { contactData: request.body, tenantId, contactId: contato };
  try {
    const contato = await UpdateContactSocketService(payload);
    return reply.code(STANDARD.OK.statusCode).send(contato);
  } catch (error) {
    console.log(error);
    return handleServerError(reply, error);
  }
};
