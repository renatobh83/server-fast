import { RedisKeys } from "../../constants/redisKeys";
import Setting from "../../models/Setting";
import { getCache, setCache } from "../../utils/cacheRedis";

const AdminListSettingsService = async (
  tenantId: number | string
): Promise<Setting[] | undefined> => {
  const whereCondition: any = {};

  if (tenantId) {
    whereCondition.tenantId = tenantId;
  }
  let settings = (await getCache(RedisKeys.settings(tenantId))) as Setting[];

  if (!settings) {
    settings = await Setting.findAll({
      where: whereCondition,
      order: [["id", "ASC"]],
      raw: true,
    });
    await setCache(RedisKeys.settings(tenantId), settings);
    return settings;
  }
  return settings;
};

export default AdminListSettingsService;
