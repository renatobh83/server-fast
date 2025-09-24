import { AppError } from "../../errors/errors.helper";
import Message from "../../models/Message";
interface PropsGetTicket {
  ticketId: number | string;
  limit: number;
  offset: number;
}
export const GetMessagesByTicketId = async ({
  limit,
  offset,
  ticketId,
}: PropsGetTicket) => {
  try {
    const messages = await Message.findAll({
      where: { ticketId },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return messages.map((msg: any) => {
      return {
        ...msg.dataValues,
        body: Message.decrypt(msg.body),
      };
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_GET_MESSAGE_BY_TICKETID_SERVICE", 502);
  }
};
