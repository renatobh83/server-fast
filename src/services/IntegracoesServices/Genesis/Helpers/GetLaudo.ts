import { getApiInstance } from "./authService";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import os from "node:os";
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
  const url = `/doLaudoExternoLista`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;
  const body = new URLSearchParams();
  body.append("cd_exame", cdExame.toString());

  const tempDir = os.tmpdir(); // diretório temporário do SO
  const uniqueName = `${exame}-${uuidV4()}.pdf`;
  const filePath = path.join(tempDir, uniqueName);

  try {
    const instanceApi = await getApiInstance(integracao, true);

    const { data } = await instanceApi.post(URL_FINAL, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/pdf",
      },
      responseType: "stream",
    });

    // Grava stream em arquivo temporário
    const writer = createWriteStream(filePath);
    data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Envia o PDF
    await BuildSendMessageService({
      ticket,
      tenantId: ticket.tenantId,
      msg: {
        type: "MediaField",
        id: uuidV4(),
        data: {
          mediaUrl: filePath, // melhor passar caminho absoluto do arquivo
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
    // Sempre remove o arquivo no fim
    await fs.unlink(filePath).catch(() => {});
  }
};    });
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
