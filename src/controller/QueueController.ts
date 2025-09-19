import { FastifyRequest, FastifyReply } from "fastify";
import { STANDARD } from "../constants/request";
import { AppError, handleServerError } from "../errors/errors.helper";
import CreateQueueService from "../services/QueueServices/CreateQueueService";
import ListQueueService from "../services/QueueServices/ListQueueService";
import UpdateQueueService from "../services/QueueServices/UpdateQueueService";
import DeleteQueueService from "../services/QueueServices/DeleteQueueService";

interface QueueData {
  queue: string;
  isActive: boolean;
}

export const createFila = async (
  request: FastifyRequest<{ Body: QueueData }>,
  reply: FastifyReply
) => {
  const { tenantId, profile, id } = request.user as any;
  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const newQueue = { ...request.body, userId: id, tenantId };
  try {
    const queue = await CreateQueueService(newQueue);
    return reply.code(STANDARD.OK.statusCode).send(queue);
  } catch (error) {
    console.log(error);
  }
};

export const listFilas = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { tenantId } = request.user as any;

  try {
    const queues = await ListQueueService({ tenantId });

    return reply.code(STANDARD.OK.statusCode).send(queues);
  } catch (error) {
    console.log(error);
  }
};

export const updateFila = async (
  request: FastifyRequest<{ Body: QueueData }>,
  reply: FastifyReply
) => {
  const { tenantId, profile, id } = request.user as any;
  const { queueId } = request.params as { queueId: string };
  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const updateQueue = { ...request.body, userId: id, tenantId };
  try {
    const queueUpdated = await UpdateQueueService({
      queueData: updateQueue,
      queueId,
    });

    return reply.code(STANDARD.OK.statusCode).send(queueUpdated);
  } catch (error) {
    console.log(error);
  }
};

export const deleteFila = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { profile, tenantId } = request.user as any;
  const { queueId } = request.params as { queueId: string };
  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  try {
    await DeleteQueueService({ id: queueId, tenantId });
    return reply
      .code(STANDARD.OK.statusCode)
      .send({ message: "Fila apagada." });
  } catch (error) {
    return handleServerError(reply, error);
  }
};
