import { AppError } from "../../errors/errors.helper";
import Integracoes from "../../models/Integracoes";

interface Request {
  id: number;
  valores_json: object;
  name: string;
}

const CreateOrUpdateDadosIntegracaoService = async ({
  id,
  valores_json,
  name,
}: Request): Promise<Integracoes> => {
  if (typeof valores_json === "string") {
    valores_json = JSON.parse(valores_json);
  }

  if (!valores_json || typeof valores_json !== "object") {
    throw new AppError("JSON_INVALID", 400);
  }
  // Verifica se a integração existe
  // const integracao = await IntegracoesDados.findOne({
  //   where: {
  //     integracaoId: id,
  //   },
  // });
  const integracao = await Integracoes.findByPk(id);

  if (!integracao) {
    throw new AppError("INTEGRATION_NOT_FOUND", 404);
  }
  // Atualiza os campos no banco]

  await integracao.update({ config_json: valores_json, name });

  return integracao;
};

export default CreateOrUpdateDadosIntegracaoService;
