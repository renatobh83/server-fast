import { AppError } from "../errors/errors.helper";
import Integracoes from "../models/Integracoes";

const GetIntegracaoById = async (id: string | number): Promise<Integracoes> => {
  const integracao = await Integracoes.findByPk(id);

  if (!integracao) {
    throw new AppError("ERR_NO_INTEGRATION_FOUND", 404);
  }

  return integracao;
};

export default GetIntegracaoById;
