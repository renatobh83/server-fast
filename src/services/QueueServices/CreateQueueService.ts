import { AppError } from "../../errors/errors.helper";
import Queue from "../../models/Queue";

interface Request {
  queue: string;
  isActive: boolean;
  userId: number;
  tenantId: number;
}

const CreateQueueService = async ({
  queue,
  isActive,
  userId,
  tenantId,
}: Request): Promise<Queue> => {
  try {
    const queueExists = await Queue.findOne({ where: { queue } });
    if (queueExists) {
      throw new AppError("QUEUE_ALREADY_EXISTS", 501);
    }
    const queueData = await Queue.create({
      queue,
      isActive,
      userId,
      tenantId,
    });

    return queueData;
  } catch (error) {
    throw new AppError("QUEUE_ERRO_CREATE", 400);
  }
};

export default CreateQueueService;
