import { AppError } from "../../../../errors/errors.helper";
import { getApiInstance } from "./authService";

interface ConsultaPacienteProps {
  email: string;
  integracao: any;
  dtNascimento: string;
}

export const RecuperarAcesso = async ({
  integracao,
  email,
  dtNascimento,
}: ConsultaPacienteProps) => {
  try {
    const url = `doPacientePassword?ds_email=${email}&dt_nascimento=${dtNascimento}`;
    const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;

    const instanceApi = await getApiInstance(integracao, true);

    const { data } = await instanceApi.post(URL_FINAL, {});

    return data;
  } catch (error: any) {
    throw new AppError(error, 500);
  }
};
