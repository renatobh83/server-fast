import { AppError } from "../../errors/errors.helper";
import Integracoes from "../../models/Integracoes";

interface Request {
  id: string;
}

const DeleteIntegracaoService = async ({ id }: Request): Promise<void> => {
  // Verifica se a integração existe
  const integracao = await Integracoes.findByPk(id);

  if (!integracao) {
    throw new AppError("INTEGRATION_NOT_FOUND", 404);
  }
  // Atualiza os campos no banco
  await integracao.destroy();
};

export default DeleteIntegracaoService;
