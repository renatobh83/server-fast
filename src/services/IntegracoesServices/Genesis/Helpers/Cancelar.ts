import { getApiInstance } from "./authService";
interface GetLaudoProps {
  integracao: any;
  cdAtendimento: number;
}

export const CancelarAgendamento = async ({
  cdAtendimento,
  integracao,
}: GetLaudoProps) => {
  const body = new URLSearchParams();
  body.append("cd_atendimento", cdAtendimento.toString());
  const url = `/doAgendaCancelar`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;

  try {
    const instanceApi = await getApiInstance(integracao, true);
    const { data } = await instanceApi.post(URL_FINAL, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return data;
  } catch (error) {
    console.error("Erro ao cancelar exame:", error);
    throw error;
  }
};
