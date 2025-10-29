import LogTicket from "../../models/LogTicket";

type LogType =
  | "access"
  | "create"
  | "closed"
  | "transfered"
  | "receivedTransfer"
  | "open"
  | "pending"
  | "queue"
  | "userDefine"
  | "delete"
  | "chatBot"
  | "autoClose"
  | "retriesLimitQueue"
  | "retriesLimitUserDefine";

interface Request {
  type: LogType;
  ticketId: number;
  userId?: number;
  queueId?: number;
  tenantId?: number;
}

const CreateLogTicketService = async ({
  type,
  userId,
  ticketId,
  queueId,
  tenantId,
}: Request): Promise<void> => {
  try {
    await LogTicket.create({
      userId,
      ticketId,
      type,
      queueId,
      tenantId,
    });
  } catch (error) {
    console.log("Erro na criacao do log", error);
  }

  // socketEmit({
  //   tenantId,
  //   type: "ticket:update",
  //   payload: ticket
  // });
};

export default CreateLogTicketService;
