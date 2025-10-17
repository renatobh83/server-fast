import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import GetTicketWbot from "./Helpers/GetTicketWbot";

export const stopTypingWbot = async (ticketId: string) => {
  const commonIncludes = [
    { model: Contact, as: "contact" },
    { model: User, as: "user", attributes: ["id", "name"] },
    { association: "whatsapp", attributes: ["id", "name"] },
  ];

  const ticket = await Ticket.findByPk(ticketId, { include: commonIncludes });
  if (!ticket) {
    throw new AppError("ERRO_TICKET_NO_FOUND", 404);
  }
  if (ticket.channel !== "whatsapp") return;

  const wbot = await GetTicketWbot(ticket);

  wbot.stopTyping(ticket.contact.serializednumber!);
};
