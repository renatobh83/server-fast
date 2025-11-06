import { AppError } from "../../../errors/errors.helper";
import Message from "../../../models/Message";
import Ticket from "../../../models/Ticket";
import GetTicketWbot from "./GetTicketWbot";

export const SendReactionMessage = async (
  messageid: string,
  reaction: string
) => {
  try {
    const messageExist = await Message.findByPk(messageid, {
      include: {
        model: Ticket,
        as: "ticket",
      },
    });

    if (!messageExist) {
      throw new AppError("ERR_SENDING_WAPP_MSG", 404);
    }

    const wbot = await GetTicketWbot(messageExist.ticket);
    await wbot.sendReactionToMessage(messageid, reaction);
  } catch (error) {
    throw new AppError("ERR_SENDING_WAPP_MSG", 501);
  }
};
