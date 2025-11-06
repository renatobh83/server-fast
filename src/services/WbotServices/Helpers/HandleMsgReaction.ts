import { Queue } from "bullmq";
import socketEmit from "../../../helpers/socketEmit";
import Contact from "../../../models/Contact";
import Message from "../../../models/Message";
import Ticket from "../../../models/Ticket";
import User from "../../../models/User";

export async function HandleMsgReaction(msg: any) {
  try {
    const messageToUpdate = await Message.findOne({
      where: { messageId: msg.msgId._serialized },
      include: [
        "contact",
        {
          model: Ticket,
          as: "ticket",
          attributes: ["id", "tenantId", "apiConfig"],
        },
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"],
        },
      ],
    });
    if (messageToUpdate) {
      const updateData = msg.id.fromMe
        ? { reactionFromMe: msg.reactionText }
        : { reaction: msg.reactionText };

      await messageToUpdate.update(updateData);

      // Recarrega com include do ticket
      const updatedMessage = await messageToUpdate.reload({
        include: [
          {
            model: Ticket,
            as: "ticket",
            include: [
              { model: Contact, as: "contact" },
              { model: User, as: "user" },
            ],
          },
        ],
      });

      socketEmit({
        tenantId: updatedMessage.ticket.tenantId,
        type: "chat:update",
        payload: updatedMessage,
      });
    }
  } catch (_error) {}
}
