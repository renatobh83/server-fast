import { RedisKeys } from "../../constants/redisKeys";
import ChatFlow from "../../models/ChatFlow";
import { getCache, setCache } from "../../utils/cacheRedis";

interface Response {
  chatFlow: ChatFlow[];
}

interface Request {
  tenantId: number;
}

const ListChatFlowService = async ({
  tenantId,
}: Request): Promise<Response> => {
  let chatFlow = (await getCache(RedisKeys.chatFlow(tenantId))) as ChatFlow[];
  if (!chatFlow) {
    chatFlow = (await ChatFlow.findAll({
      where: { tenantId },
      raw: true,
    })) as ChatFlow[];
    await setCache(RedisKeys.chatFlow(tenantId), chatFlow);
  }

  return { chatFlow };
};

export default ListChatFlowService;
