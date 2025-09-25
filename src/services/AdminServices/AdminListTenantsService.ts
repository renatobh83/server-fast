import { RedisKeys } from "../../constants/redisKeys";
import Tenant from "../../models/Tenant";
import { getCache, setCache } from "../../utils/cacheRedis";

const AdminListTenantsService = async (): Promise<Tenant[]> => {
  let tenants = (await getCache(RedisKeys.tentantServices())) as Tenant[];
  if (!tenants) {
    tenants = await Tenant.findAll({
      order: [["name", "ASC"]],
      raw: true,
    });
    await setCache(RedisKeys.tentantServices(), tenants);
  }

  return tenants;
};

export default AdminListTenantsService;
