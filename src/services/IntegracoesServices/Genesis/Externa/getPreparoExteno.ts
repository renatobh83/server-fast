import { getApiInstance } from "../Helpers/authService";
interface RequestProps {
  integracao: any;
  atedimento: any;
}

export const getPreparoExteno = async ({
  integracao,
  atedimento,
}: RequestProps) => {
  const url = `doProcedimentoPreparo`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;
  const body = new URLSearchParams();
  body.append("cd_procedimento", atedimento);
  const instanceApi = await getApiInstance(integracao, true);
  const { data } = await instanceApi.post(URL_FINAL, body);
  if (!data[0].bb_preparo) {
    return null;
  }
  const blob = data[0].bb_preparo;

  return blob;
};
