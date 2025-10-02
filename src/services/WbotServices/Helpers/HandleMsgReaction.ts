import socketEmit from "../../../helpers/socketEmit";
import Message from "../../../models/Message";
import Ticket from "../../../models/Ticket";

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
      const { ticket } = messageToUpdate;
      if (msg.id.fromMe) {
        const updateData = { reactionFromMe: msg.reactionText };
        await messageToUpdate.update(updateData);
        socketEmit({
          tenantId: ticket.tenantId,
          type: "chat:update",
          payload: messageToUpdate,
        });
      }
      if (!msg.id.fromMe) {
        const updateData = { reaction: msg.reactionText };
        await messageToUpdate.update(updateData);
        socketEmit({
          tenantId: ticket.tenantId,
          type: "chat:update",
          payload: messageToUpdate,
        });
      }
    }
  } catch (_error) {}
}
