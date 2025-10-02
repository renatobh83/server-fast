import { AppError } from "../../../../errors/errors.helper";
import { getApiInstance } from "./authService";

interface ConsultaAtendimentoProps {
  integracao: any;
  codigoPaciente: string;
  token: string;
}

export const ConsultaAtendimentos = async ({
  integracao,
  codigoPaciente,
  token,
}: ConsultaAtendimentoProps) => {
  try {
    const url = `/doListaAtendimento?cd_paciente=${codigoPaciente}&token=${token}`;
    const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;

    const instanceApi = await getApiInstance(integracao, true);

    const { data } = await instanceApi.post(URL_FINAL, null);
    if (data.length) {
      return data
        .filter((i: { nr_laudo: null }) => i.nr_laudo !== null)
        .filter((a: { sn_assinado: boolean }) => a.sn_assinado === true)
        .sort((a: { dt_data: string }, b: { dt_data: string }) => {
          const dateA = new Date(a.dt_data.split("/").reverse().join("-"));
          const dateB = new Date(b.dt_data.split("/").reverse().join("-"));
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5); // Seleciona os 5 registros mais recentes
    }
    return [];
  } catch (error: any) {
    throw new AppError(error, 500);
  }
};
