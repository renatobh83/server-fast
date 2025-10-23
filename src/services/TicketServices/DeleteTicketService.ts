import { AppError } from "../../errors/errors.helper";
import Ticket from "../../models/Ticket";
import CreateLogTicketService from "./CreateLogTicketService";

import ShowTicketService from "./ShowTicketService";

interface Request {
  id: string | number;
  tenantId: number;
  userId: number;
}

const DeleteTicketService = async ({
  id,
  tenantId,
  userId,
}: Request): Promise<Ticket> => {
  try {
    const ticket = await ShowTicketService({ id, tenantId });

    if (!ticket) {
      throw new AppError("ERR_NO_TICKET_FOUND", 404);
    }

    await ticket.destroy();
    await CreateLogTicketService({
      userId,
      ticketId: ticket.id,
      type: "delete",
      tenantId: ticket.tenantId,
    });
    return ticket;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_DELETE_TICKET_SERVICE", 500);
  }
};

export default DeleteTicketService;
