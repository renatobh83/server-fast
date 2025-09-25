import { RedisKeys } from "../../constants/redisKeys";
import { AppError } from "../../errors/errors.helper";
import { redisClient } from "../../lib/redis";
import Tenant from "../../models/Tenant";

interface Request {
  address?: object;
  dadosNfe?: object;
  razaoSocial: string;
  tenantId: number | string;
}

const UpdateDadosTenantService = async ({
  address,
  dadosNfe,
  razaoSocial,
  tenantId,
}: Request): Promise<Tenant> => {
  const tenantModel = await Tenant.findOne({
    where: { id: tenantId },
  });

  if (!tenantModel) {
    throw new AppError("ERR_NO_TENANT_FOUND", 404);
  }

  await tenantModel.update({
    address,
    dadosNfe,
    name: razaoSocial,
  });
  redisClient.del(RedisKeys.tentantServices());
  return tenantModel;
};

export default UpdateDadosTenantService;
