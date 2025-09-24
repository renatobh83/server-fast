
import SendMessageSystemProxy from "../../helpers/SendMessageSystemProxy";
import Ticket from "../../models/Ticket";

import { UpdateBotMessage } from "../TbotServices/UpdateBotMessage";
interface Request {
    options: any,
    ticket: Ticket;

}
export const SendTbotAppMessageList = async ({
    options,
    ticket,

}: Request): Promise<void> => {

    const msg = await SendMessageSystemProxy({ media: null, userId: null, ticket, messageData: options })
    await UpdateBotMessage(msg, ticket)
    return msg


}
