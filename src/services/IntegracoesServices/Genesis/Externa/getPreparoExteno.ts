import { getApiInstance } from "../Helpers/authService";
interface RequestProps {
  integracao: any;
  atedimento: number;
}

export const getPreparoExteno = async ({
  integracao,
  atedimento,
}: RequestProps) => {
  const url = `doProcedimentoPreparo?cd_procedimento=${atedimento}`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;

  const instanceApi = await getApiInstance(integracao, true);
  const { data } = await instanceApi.post(URL_FINAL, null);
  if (!data[0].bb_preparo) {
    return null;
  }
  const blob = data[0].bb_preparo;

  return blob;
};
