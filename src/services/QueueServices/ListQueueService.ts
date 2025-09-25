import { RedisKeys } from "../../constants/redisKeys";
import Queue from "../../models/Queue";
import { getCache, setCache } from "../../utils/cacheRedis";

interface Request {
  tenantId: number;
}
const ListQueueService = async ({ tenantId }: Request): Promise<Queue[]> => {
  let queueData = (await getCache(RedisKeys.queues(tenantId))) as Queue[];
  if (!queueData) {
    queueData = await Queue.findAll({
      where: {
        tenantId,
      },
      order: [["queue", "ASC"]],
    });
    await setCache(RedisKeys.settings(tenantId), queueData);
  }

  return queueData;
};

export default ListQueueService;
