import { Socket, Server as socketIo } from "socket.io";

export const initIO = async (server: any): Promise<void> => {
  server.io.use(async (socket: any, next: any) => {
    try {
      const token = socket?.handshake?.auth?.token;
    } catch {}
  });
  server.io.on("connection", async (socket: Socket) => {
    const { tenantId, type } = socket.handshake.auth;

    if (type) {
      //   await HandleMessageChatClient(socket);
      return;
    }
    // if (tenantId) {
    //   console.info({
    //     message: "Client connected in tenant",
    //     data: socket.handshake.auth,
    //   });
    //   // create room to tenant
    //   socket.join(tenantId.toString());

    //   socket.on(`${tenantId}:joinChatBox`, (ticketId) => {
    //     console.info(`Client joined a ticket channel ${tenantId}:${ticketId}`);
    //     socket.join(`${tenantId}:${ticketId}`);
    //   });

    //   socket.on(`${tenantId}:joinNotification`, () => {
    //     console.info(
    //       `A client joined notification channel ${tenantId}:notification`
    //     );
    //     socket.join(`${tenantId}:notification`);
    //   });

    //   socket.on(`${tenantId}:joinTickets`, (status) => {
    //     console.info(
    //       `A client joined to ${tenantId}:${status} tickets channel.`
    //     );
    //     socket.join(`${tenantId}:${status}`);
    //   });
    //   //   Chat.register(socket);
    // }
    socket.on("disconnect", (reason: any) => {
      console.info({
        message: `SOCKET Client disconnected , ${tenantId}, ${reason}`,
      });
    });
  });
};
