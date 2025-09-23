import { Whatsapp } from "wbotconnect";
import Ticket from "../../../models/Ticket";
import GetDefaultWhatsApp from "../../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../../lib/wbot";

const GetTicketWbot = async (ticket: Ticket): Promise<Whatsapp> => {
  if (!ticket.whatsappId) {
    const defaultWhatsapp = await GetDefaultWhatsApp(ticket.tenantId);

    await ticket.update({ whatsappId: defaultWhatsapp.id });
  }

  const wbot = getWbot(ticket.whatsappId);

  return wbot;
};

export default GetTicketWbot;
