import { AppError } from "../../errors/errors.helper";
import Integracoes from "../../models/Integracoes";

interface Request {
  id: number;
  config_json: object;
  name: string;
}

const UpdateIntegracoesServices = async ({
  id,
  config_json,
  name,
}: Request): Promise<Integracoes> => {
  if (typeof config_json === "string") {
    config_json = JSON.parse(config_json);
  }

  if (!config_json || typeof config_json !== "object") {
    throw new AppError("JSON_INVALID", 404);
  }
  // Verifica se a integração existe
  const integracao = await Integracoes.findByPk(id);

  if (!integracao) {
    throw new AppError("INTEGRATION_NOT_FOUND", 404);
  }

  // Atualiza os campos no banco
  await integracao.update({ config_json, name });

  return integracao;
};

export default UpdateIntegracoesServices;
