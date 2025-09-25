import { RedisKeys } from "../../constants/redisKeys";
import Setting from "../../models/Setting";
import { getCache, setCache } from "../../utils/cacheRedis";

const ListSettingsService = async (
  tenantId: number | string
): Promise<Setting[] | undefined> => {
  let settings = (await getCache(RedisKeys.settings(tenantId))) as Setting[];
  if (!settings) {
    settings = await Setting.findAll({
      where: { tenantId },
    });
    await setCache(RedisKeys.settings(tenantId), settings);
  }

  return settings;
};

export default ListSettingsService;
