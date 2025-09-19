import { getApiInstance } from "./authService";
import fs from "node:fs/promises"; // <--- usando fs/promises
import path from "node:path";
import BuildSendMessageService from "../../../ChatFlowServices/BuildSendMessageService";
import Ticket from "../../../../models/Ticket";
interface GetLaudoProps {
  integracao: any;
  cdExame: number;
  ticket: Ticket;
  exame: string;
  cdPaciente: string;
}
import { v4 as uuidV4 } from "uuid";

export const GetLaudo = async ({
  cdExame,
  integracao,
  ticket,
  exame,
  cdPaciente,
}: GetLaudoProps) => {
  // const newURL = `https://gdicomvixnew.zapto.org/dwclinux/www/doLaudoDownload?cd_exame=${cdExame}&cd_paciente=${cdPaciente}&cd_funcionario=230&sn_entrega=true`;
  const baseUrl = new URL(integracao.config_json.baseUrl).origin + "/";
  const subDominio = integracao.config_json.homologacao ? "dwportalrf" : "dwclinux"
  const newURL = `${baseUrl}${subDominio}/www/doLaudoDownload?cd_exame=${cdExame}&cd_paciente=${cdPaciente}&cd_funcionario=1&sn_entrega=false`;
  try {
    const instanceApi = await getApiInstance(integracao, true);

    const { data } = await instanceApi.get(newURL, {
      headers: {
        Accept: "application/pdf",
      },
      responseType: "stream",
    });
    const publicFolder = path.join(process.cwd(), "public");
    const filePath = path.resolve(publicFolder, `${exame}.pdf`);
    await fs.writeFile(filePath, data);

    await BuildSendMessageService({
      ticket,
      tenantId: ticket.tenantId,
      msg: {
        type: "MediaField",
        id: uuidV4(),
        data: {
          mediaUrl: `${exame}.pdf`,
          name: "Laudo Exame",
          message: {
            mediaType: "document",
          },
        },
      },
    });
  } catch (error) {
    console.error("Erro ao confirmar exame:", error);
    throw error;
  }
};
