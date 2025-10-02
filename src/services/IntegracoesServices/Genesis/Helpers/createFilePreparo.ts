import { getApiInstance } from "./authService";
import fs from "node:fs";
import path from "node:path";
interface RequestProps {
  integracao: any;
  atendimento: number;
}

export const CreateFilePreparo = async ({
  integracao,
  atendimento,
}: RequestProps) => {
  const url = `doProcedimentoPreparo?cd_procedimento=${atendimento}`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;

  const instanceApi = await getApiInstance(integracao, true);
  const { data } = await instanceApi.post(URL_FINAL, null);

  if (!data[0].bb_preparo) {
    return null;
  }
  const blob = data[0].bb_preparo;

  const buffer = Buffer.from(blob, "base64");

  const publicFolder = path.join(process.cwd(), "public");

  const filePath = path.resolve(
    publicFolder,
    `Preparo exame_${atendimento}.html`
  );

  fs.writeFileSync(filePath, buffer);
  return blob;
};
