import { FastifyReply, FastifyRequest } from "fastify";
import { CreateContactService } from "../services/ContactServices/CreateContactService";
import { handleServerError } from "../errors/errors.helper";
import { STANDARD } from "../constants/request";
import ListContactsService from "../services/ContactServices/ListContactsService";
import UpdateContactService, {
  ContactDataUpdate,
} from "../services/ContactServices/UpdateContactService";
import ShowContactService from "../services/ContactServices/ShowContactService";
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
    //     const wppInitialized = await CheckWappInitialized(tenantId);
    //   if (wppInitialized) {
    //     const dataContato = await CheckIsValidContact(
    //       newContact.number,
    //       tenantId
    //     );

    //   if (dataContato.isWAContact) {
    //     newContact.name =
    //       dataContato.pushname ||
    //       dataContato.verifiedName ||
    //       dataContato.name ||
    //       dataContato.formattedName;
    //     newContact.profilePicUrl = dataContato.profilePicThumbObj.eurl;
    //     newContact.isWAContact = dataContato.isWAContact;
    //   } else {
    //     newContact.profilePicUrl = dataContato.eurl;
    //   }
    // }
    const contact = await CreateContactService({
      ...newContato,
      tenantId,
    });
    return reply.code(STANDARD.OK.statusCode).send(contact);
  } catch (error) {
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
    //     const wppInitialized = await CheckWappInitialized(tenantId);
    //   if (wppInitialized) {
    //     const dataContato = await CheckIsValidContact(
    //       newContact.number,
    //       tenantId
    //     );

    //   if (dataContato.isWAContact) {
    //     newContact.name =
    //       dataContato.pushname ||
    //       dataContato.verifiedName ||
    //       dataContato.name ||
    //       dataContato.formattedName;
    //     newContact.profilePicUrl = dataContato.profilePicThumbObj.eurl;
    //     newContact.isWAContact = dataContato.isWAContact;
    //   } else {
    //     newContact.profilePicUrl = dataContato.eurl;
    //   }
    // }
    const contact = await UpdateContactService({
      contactData: newContato,
      contactId,
      tenantId,
    });
    return reply.code(STANDARD.OK.statusCode).send(contact);
  } catch (error) {
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
