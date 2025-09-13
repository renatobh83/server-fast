import { AppError } from "../../errors/errors.helper";
import Tenant from "../../models/Tenant";


interface Request {
  tenantId: number | string;
}

const ListDadosTenantService = async ({
  tenantId,
}: Request): Promise<Tenant> => {
  const tenant = await Tenant.findByPk(tenantId, {
    attributes: ["address", "dadosNfe", "name"],
  });

  if (!tenant) {
    throw new AppError("ERR_NO_TENANT_FOUND", 404);
  }

  return tenant;
};

export default ListDadosTenantService;
