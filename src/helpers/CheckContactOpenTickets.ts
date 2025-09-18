import { Op } from "sequelize";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact"; // Mantido para o include
import User from "../models/User"; // Mantido para o include

import { AppError } from "../errors/errors.helper";

const CheckContactOpenTickets = async (
  contactId: number,
  whatsappId: number
): Promise<Ticket | null> => {
  // Alterado para retornar Ticket ou null
  try {
    const ticket = await Ticket.findOne({
      include: [
        {
          model: Contact,
          as: "contact",
          attributes: ["profilePicUrl", "name"], // Pegando apenas profilePicUrl
        },
        {
          model: User,
          as: "user",
          attributes: ["name"],
        },
      ],
      where: {
        contactId,
        status: { [Op.or]: ["open", "pending"] },
        whatsappId,
      },
    });

    // Se um ticket for encontrado, retorne-o diretamente
    if (ticket) {
      return ticket;
    }
    // Se nenhum ticket for encontrado, retorne null
    return null;
  } catch (error) {
    console.log(error);
    throw new AppError("ERR_CREATING_TICKET", 501);
  }
};

export default CheckContactOpenTickets;
