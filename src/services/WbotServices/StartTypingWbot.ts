import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import GetTicketWbot from "./Helpers/GetTicketWbot";
import { setTyping } from "./Helpers/typingManager";

export const startTypingWbot = async (ticketId: string) => {
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
  // 🔒 Evita chamadas repetidas
  const canSend = setTyping(ticketId, 3000); // 3s bloqueio
  if (!canSend) {
    return; // já está digitando, não envia de novo
  }

  const wbot = await GetTicketWbot(ticket);

  wbot.startTyping(ticket.contact.serializednumber!);
};
