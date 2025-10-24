import { AppError } from "../../errors/errors.helper";
import Integracoes from "../../models/Integracoes";

interface Request {
  name: string;
  config_json: object;
  tenantId: number;
}

const CreateIntegracoesService = async ({
  name,
  config_json,
  tenantId,
}: Request): Promise<Integracoes> => {
  const integracaoExists = await Integracoes.findOne({ where: { name } });

  if (typeof config_json === "string") {
    config_json = JSON.parse(config_json);
  }

  if (!config_json || typeof config_json !== "object") {
    throw new AppError("JSON_INVALID", 400);
  }
  if (integracaoExists) {
    throw new AppError("QUEUE_ALREADY_EXISTS", 501);
  }
  const integracaoGenesis = await Integracoes.create({
    name,
    config_json,
    tenantId,
  });

  return integracaoGenesis;
};

export default CreateIntegracoesService;
