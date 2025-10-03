import { getApiInstance } from "./authService";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { v4 as uuidV4 } from "uuid";
import BuildSendMessageService from "../../../ChatFlowServices/BuildSendMessageService";
import Ticket from "../../../../models/Ticket";

interface GetLaudoProps {
  integracao: any;
  cdExame: number;
  ticket: Ticket;
  exame: string;
  cdPaciente: string;
}

export const GetLaudo = async ({
  cdExame,
  integracao,
  ticket,
  exame,
}: GetLaudoProps) => {
  const url = `doLaudoExternoLista`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;
  const body = new URLSearchParams();
  body.append("cd_exame", cdExame.toString());

  // gera nome único no public/
  const publicFolder = path.join(process.cwd(), "public");
  const uniqueName = `${exame}-${uuidV4()}.pdf`;
  const filePath = path.join(publicFolder, uniqueName);

  try {
    const instanceApi = await getApiInstance(integracao, true);

    const { data } = await instanceApi.post(URL_FINAL, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/pdf",
      },
      responseType: "stream",
    });

    // grava stream no arquivo da pasta pública
    const writer = createWriteStream(filePath);
    data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // envia usando o nome relativo (acessível via public/)
    await BuildSendMessageService({
      ticket,
      tenantId: ticket.tenantId,
      msg: {
        type: "MediaField",
        id: uuidV4(),
        data: {
          mediaUrl: uniqueName, // << só o nome do arquivo, já que está em public/
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
  } finally {
    // remove arquivo depois do envio
    await fs.unlink(filePath).catch(() => {});
  }
};
