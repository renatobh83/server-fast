import { AppError } from "../../errors/errors.helper";
import socketEmit from "../../helpers/socketEmit";
import { getIO } from "../../lib/socket";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import User from "../../models/User";

interface TicketData {
  status?: string;
  userId?: number;
  tenantId: number;
  queueId?: number | null;
  autoReplyId?: number | string | null;
  stepAutoReplyId?: number | string | null;
}

interface Request {
  ticketData: TicketData;
  ticketId: number;
  isTransference?: string | boolean | null;
  userIdRequest: number;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  isTransference,
  userIdRequest,
}: Request): Promise<Response> => {
  const { status, userId, tenantId, queueId } = ticketData;

  const ticket = await Ticket.findOne({
    where: { id: ticketId, tenantId },
    include: [
      {
        model: Contact,
        as: "contact",
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name"],
      },
      {
        association: "whatsapp",
        as: "whatsapp",
        attributes: ["id", "name"],
      },
      {
        association: "empresa",
        as: "empresa",
        attributes: ["id", "name"],
      },
    ],
  });

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  // await SetTicketMessagesAsRead(ticket);

  // Variavel para notificar usuário de novo contato como pendente
  const toPending =
    ticket.status !== "pending" && ticketData.status === "pending";

  const oldStatus = ticket.status;
  const oldUserId = ticket.toJSON().user?.id;

  if (oldStatus === "closed") {
    // await CheckContactOpenTickets(ticket.contact.id);
  }

  // verificar se o front envia close e substituir por closed
  const statusData = status === "close" ? "closed" : status;

  const data: any = {
    status: statusData,
    queueId,
    userId: ticket.isGroup ? null : userId,
  };

  // se atendimento for encerrado, informar data da finalização
  if (statusData === "closed") {
    data.closedAt = new Date().getTime();
    if (ticket.channel === "chatClient") {
      const io = getIO();
      const socket = io.sockets.sockets.get(ticket.socketId);
      if (socket && socket.connected) {
        socket.emit("chat:closedTicket", "Seu ticket foi fechado. Obrigado!");
      }
    }
  }

  // se iniciar atendimento, retirar o bot e informar a data
  if (oldStatus === "pending" && statusData === "open") {
    data.autoReplyId = null;
    data.chatFlowId = null;
    data.stepAutoReplyId = null;
    data.startedAttendanceAt = new Date().getTime();
  }


  await ticket.update(data);

  // logar o inicio do atendimento
  // if (oldStatus === "pending" && statusData === "open") {
  //   await CreateLogTicketService({
  //     userId: userIdRequest,
  //     ticketId,
  //     type: "open",
  //     tenantId: ticket.tenantId,
  //   });
  // }

  // // logar ticket resolvido
  // if (statusData === "closed") {
  //   await CreateLogTicketService({
  //     userId: userIdRequest,
  //     ticketId,
  //     type: "closed",
  //     tenantId: ticket.tenantId,
  //   });
  // }

  // // logar ticket retornado à pendente
  // if (oldStatus === "open" && statusData === "pending") {
  //   await CreateLogTicketService({
  //     userId: userIdRequest,
  //     ticketId,
  //     type: "pending",
  //     tenantId: ticket.tenantId,
  //   });
  // }

  // if (isTransference) {
  //   // tranferiu o atendimento
  //   await CreateLogTicketService({
  //     userId: userIdRequest,
  //     ticketId,
  //     type: "transfered",
  //     tenantId: ticket.tenantId,
  //   });
  //   // recebeu o atendimento tansferido
  //   if (userId) {
  //     await CreateLogTicketService({
  //       userId,
  //       ticketId,
  //       type: "receivedTransfer",
  //       tenantId: ticket.tenantId,
  //     });
  //   }
  // }

  await ticket.reload();

  if (isTransference) {
    ticket.setDataValue("isTransference", true);
  }

  if (toPending) {
    socketEmit({
      tenantId,
      type: "notification:new",
      payload: ticket,
    });
  }
  socketEmit({
    tenantId,
    type: "ticket:update",
    payload: ticket,
  });
  const ticketJson = ticket.toJSON();
  const formattedTicket = {
    ...ticketJson,
    empresanome: ticketJson.empresa?.name || null,
    username: ticketJson.user?.name,
    name: ticketJson.contact.name,
    profilePicUrl: ticketJson.contact.profilePicUrl,
  } as unknown as Ticket;
  return { ticket: formattedTicket, oldStatus, oldUserId };
};

export default UpdateTicketService;
