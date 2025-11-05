import { getApiInstance } from "./authService";
type Sessao = {
  dadosPaciente: {
    ds_token: string;
  };
  planoSelecionado: string;
};
type PrecoExameProps = {
  cdProcedimento: number;
  sessao: Sessao;
  integracao: any;
};
export const PrecoExame = async ({
  cdProcedimento,
  sessao,
  integracao,
}: PrecoExameProps) => {
  const { planoSelecionado, dadosPaciente } = sessao;
  const body = new URLSearchParams();
  body.append("cd_procedimento", cdProcedimento.toString());
  body.append("token", dadosPaciente.ds_token);
  body.append("cd_plano", planoSelecionado);
  const url = `doProcedimentoValor`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;
  console.log(URL_FINAL);
  const instanceApi = await getApiInstance(integracao, true);
  try {
    const { data } = await instanceApi.post(URL_FINAL, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return data[0];
  } catch (error: any) {
    console.log(error);
    return error.response.data;
  }
};
