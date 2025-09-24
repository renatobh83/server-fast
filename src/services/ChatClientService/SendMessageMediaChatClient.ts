import socketEmit from "../../helpers/socketEmit";
import { getIO } from "../../lib/socket";

import Ticket from "../../models/Ticket";
import { v4 as uuidV4 } from "uuid";
export const SendMessageMediaChatClient = async (
  media: any,
  ticket: Ticket
) => {
  const io = getIO();
  const socket = io.sockets.sockets.get(ticket.socketId);

  const link = `${process.env.BACKEND_URL}/public/${media.filename}`;

  if (socket && socket.connected) {
    socket.emit("chat:image", { url: link });
    await ticket.update({
      lastMessage:
        media.filename.length > 255
          ? media.filename.slice(0, 252) + "..."
          : media.filename,
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
    ...media,
  };
};
