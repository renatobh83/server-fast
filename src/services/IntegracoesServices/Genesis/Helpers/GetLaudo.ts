import { getApiInstance } from "./authService";
import fs from "node:fs/promises"; // <--- usando fs/promises
import path from "node:path";
// import BuildSendMessageService from "../../../ChatFlowServices/BuildSendMessageService";
import Ticket from "../../../../models/Ticket";
interface GetLaudoProps {
  integracao: any;
  cdExame: number;
  ticket: Ticket;
  exame: string;
  cdPaciente: string;
}
import { v4 as uuidV4 } from "uuid";
import BuildSendMessageService from "../../../ChatFlowServices/BuildSendMessageService";

export const GetLaudo = async ({
  cdExame,
  integracao,
  ticket,
  exame,
  cdPaciente,
}: GetLaudoProps) => {
  const url = `/doLaudoExternoLista`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;
  const body = new URLSearchParams();
  body.append("cd_exame", cdExame.toString());

  try {
    const instanceApi = await getApiInstance(integracao, true);

    const { data } = await instanceApi.post(URL_FINAL, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
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
 //   fs.unlink(filePath);
  } catch (error) {
    console.error("Erro ao confirmar exame:", error);
    throw error;
  }
};
