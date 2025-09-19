import { AppError } from "../../errors/errors.helper";
import Integracoes from "../../models/Integracoes";

interface Request {
  tenantId: number;
}

const ListIntegracoesService = async ({
  tenantId,
}: Request): Promise<Integracoes[]> => {
  // Verifica se a integração existe
  const integracaoExists = await Integracoes.findAll({
    where: { tenantId },
  });

  if (!integracaoExists) {
    throw new AppError("INTEGRATION_NOT_FOUND", 404);
  }

  return integracaoExists;
};

export default ListIntegracoesService;
