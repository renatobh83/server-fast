import { AppError } from "../errors/errors.helper";
import Integracoes from "../models/Integracoes";

const GetIntegracao = async (
  tenantId: string | number,
  id: string
): Promise<Integracoes> => {
  const integracao = await Integracoes.findOne({
    where: {
      tenantId,
      id,
    },
  });

  if (!integracao || !tenantId) {
    throw new AppError("ERR_NO_INTEGRATION_FOUND", 404);
  }

  return integracao;
};

export default GetIntegracao;
