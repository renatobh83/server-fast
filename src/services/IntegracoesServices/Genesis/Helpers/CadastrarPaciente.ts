import GetIntegracao from "../../../../helpers/GetIntegracao";

import { getApiInstance } from "./authService";
import FormData from "form-data";
interface CadastroPacienteProps {
  token: any;
  formdata: any;
}
export const CadastroPaciente = async ({
  token,
  formdata,
}: CadastroPacienteProps) => {
  const { id, tenantId } = token;
  const integracao = (await GetIntegracao(tenantId, id)) as any;

  const url = `doPacienteTabela`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;

  const json = JSON.stringify(formdata);
  const base64 = Buffer.from(json).toString("base64");
  const form = new FormData();
  form.append("js_paciente", base64);
  form.append("cd_operacao", 1);
  try {
    const instanceApi = await getApiInstance(integracao, true);
    const { data } = await instanceApi.post(URL_FINAL, form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    return data;
  } catch (error: any) {
    throw error.response.data;
  }
};
