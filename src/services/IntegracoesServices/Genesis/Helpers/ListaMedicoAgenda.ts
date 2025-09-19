import { getApiInstance } from "./authService";

type ListaExameMedicoProps = {
  cdProcedimento: number;
  integracao: any;
  token: string;
  cdEmpresa: number;
};
export const ListaMedicoExame = async ({
  cdProcedimento,
  integracao,
  token,
  cdEmpresa,
}: ListaExameMedicoProps) => {
  const body = new URLSearchParams();
  body.append("cd_procedimento", cdProcedimento.toString());
  body.append("token", token);
  body.append("cd_empresa", cdEmpresa.toString());

  const url = `doListaMedico`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;
  const instanceApi = await getApiInstance(integracao, true);
  const { data } = await instanceApi.post(URL_FINAL, body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return data;
};
