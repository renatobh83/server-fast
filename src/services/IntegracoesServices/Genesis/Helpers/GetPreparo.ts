import { getApiInstance } from "./authService";
import fs from "node:fs/promises"; // <--- usando fs/promises
import path from "node:path";
import Ticket from "../../../../models/Ticket";
import { v4 as uuidV4 } from "uuid";
import BuildSendMessageService from "../../../ChatFlowServices/BuildSendMessageService";

export const getPreparo = async (
  chosenIndex: string,
  integracao: any,
  ticket: Ticket
) => {
  const url = `doProcedimentoPreparo`;
  // const url = `doProcedimentoPreparo?cd_procedimento=${chosenIndex}`;
  const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;
  const body = new URLSearchParams();
  body.append("cd_procedimento", chosenIndex);

  const publicFolder = path.join(process.cwd(), "public");
  const filePath = path.resolve(
    publicFolder,
    `Preparo exame_${chosenIndex}.html`
  );
  try {
    const instanceApi = await getApiInstance(integracao, true);
    const { data } = await instanceApi.post(URL_FINAL, body);

    if (!data[0].bb_preparo) {
      return null;
    }
    const blob = data[0].bb_preparo;
    const buffer = Buffer.from(blob, "base64");

    await fs.writeFile(filePath, buffer);

    await BuildSendMessageService({
      ticket,
      tenantId: ticket.tenantId,
      msg: {
        type: "MediaField",
        id: uuidV4(),
        data: {
          mediaUrl: `Preparo exame_${chosenIndex}.html`,
          name: "Preparo Exame",
          message: {
            mediaType: "document",
          },
        },
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
};
