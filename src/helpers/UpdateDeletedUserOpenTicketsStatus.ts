import type Ticket from "../models/Ticket";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";

const UpdateDeletedUserOpenTicketsStatus = async (
  tickets: Ticket[],
  tenantId: number,
  userIdRequest: number
): Promise<void> => {
  tickets.forEach(async (t) => {
    const ticketId = t.id;

    await UpdateTicketService({
      ticketData: { status: "pending", tenantId },
      ticketId,
      userIdRequest,
    });
  });
};

export default UpdateDeletedUserOpenTicketsStatus;
