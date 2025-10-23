import { RedisKeys } from "../../constants/redisKeys";
import { AppError } from "../../errors/errors.helper";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import socketEmit from "../../helpers/socketEmit";
import Ticket from "../../models/Ticket";
import { getCache, setCache } from "../../utils/cacheRedis";

import ShowContactService from "../ContactServices/ShowContactService";
import CreateLogTicketService from "./CreateLogTicketService";
import ShowTicketService from "./ShowTicketService";
// import ShowTicketService from "./ShowTicketService";

interface Request {
  contactId: number;
  status: string;
  userId: number;
  tenantId: string | number;
  channel: string;
  channelId?: number;
}

// Modifique o tipo de retorno para incluir a possibilidade de um objeto com existingTicketId
//   Ticket | { existingTicketId: Ticket; message: string }
const CreateTicketService = async ({
  contactId,
  status,
  userId,
  tenantId,
  channel,
  channelId = undefined,
}: Request): Promise<
  Ticket | { existingTicketId: Ticket; message: string }
> => {
  try {
    const defaultWhatsapp = await GetDefaultWhatsApp(tenantId, channelId);
    if (!channel || !["instagram", "telegram", "whatsapp"].includes(channel)) {
      throw new AppError("ERR_CREATING_TICKET", 501);
    }

    // --- INÍCIO DA MODIFICAÇÃO ---
    const existingOpenTicket = await CheckContactOpenTickets(
      contactId,
      defaultWhatsapp.id
    );

    if (existingOpenTicket) {
      // Se um ticket aberto for encontrado, retorne uma resposta específica
      // O frontend irá usar essa informação para perguntar ao usuário
      return {
        existingTicketId: existingOpenTicket,
        message:
          "Já existe um ticket aberto para este contato. Deseja abri-lo?",
      };
    }
    // --- FIM DA MODIFICAÇÃO ---

    let isGroup = await getCache(RedisKeys.contactTicket(+tenantId, contactId));
    if (!isGroup) {
      const contact = await ShowContactService({ id: contactId, tenantId });
      isGroup = contact.isGroup;
      await setCache(RedisKeys.contactTicket(+tenantId, contactId), isGroup);
    }

    const { id }: Ticket = await Ticket.create({
      contactId,
      status,
      isGroup,
      userId,
      isActiveDemand: true,
      channel,
      tenantId,
      whatsappId: defaultWhatsapp.id, // 🔑 vínculo manual
    });

    let ticket = (await getCache(
      RedisKeys.ticketService(tenantId, id)
    )) as Ticket;
    if (!ticket) {
      ticket = await ShowTicketService({ id, tenantId });
      await CreateLogTicketService({
        userId,
        ticketId: ticket.id,
        type: "open",
        tenantId: ticket.tenantId,
      });
      await setCache(RedisKeys.ticketService(tenantId, id), ticket);
    }

    const jsonTicket = ticket.toJSON();

    if (!ticket) {
      throw new AppError("ERR_CREATING_TICKET", 501);
    }

    socketEmit({
      tenantId,
      type: "ticket:update",
      payload: ticket,
    });

    const formattedTicket = {
      ...jsonTicket,
      username: jsonTicket.user.name,
      name: jsonTicket.contact.name,
      profilePicUrl: jsonTicket.contact.profilePicUrl,
    } as unknown as Ticket;

    return formattedTicket;
  } catch (err: any) {
    if (err instanceof AppError) {
      throw err;
    }

    throw new AppError("ERR_CREATING_TICKET", 500);
  }
};

export default CreateTicketService;
