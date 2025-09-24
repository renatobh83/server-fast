import socketEmit from "../../helpers/socketEmit";
import { getIO } from "../../lib/socket";

import Ticket from "../../models/Ticket";
import { v4 as uuidV4 } from "uuid";
export const SendMessageChatClient = async (
  messageData: any,
  ticket: Ticket
) => {
  const io = getIO();
  const socket = io.sockets.sockets.get(ticket.socketId);

  if (socket && socket.connected) {
    socket.emit("chat:reply", messageData.body);
    await ticket.update({
      lastMessage:
        messageData.body.length > 255
          ? messageData.body.slice(0, 252) + "..."
          : messageData.body,
      lastMessageAt: new Date().getTime(),
    });
  } else {
    socketEmit({
      tenantId: ticket.tenantId,
      type: "ChatClientDesconectado",
      payload: ticket,
    });
  }

  return {
    id: uuidV4(),
    ...messageData,
  };
};
