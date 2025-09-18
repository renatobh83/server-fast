import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import User from "../../models/User";

interface Request {
  id: string | number;
  tenantId: string | number;
}
const ShowTicketService = async ({
  id,
  tenantId,
}: Request): Promise<Ticket> => {
  try {
    const ticket = await Ticket.findByPk(id, {
      include: [
        {
          model: Contact,
          as: "contact",
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
        {
          association: "whatsapp",
          as: "whatsapp",
          attributes: ["id", "name"],
        },
      ],
      // logging: console.log,
    });

    if (!ticket || ticket.tenantId !== tenantId) {
      throw new AppError("ERR_NO_TICKET_FOUND", 404);
    }

    return ticket;
  } catch (error) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }
};

export default ShowTicketService;
