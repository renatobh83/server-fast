import { getApiInstance } from "./authService";
import fs from "node:fs/promises"; // <--- usando fs/promises
import path from "node:path";
// import BuildSendMessageService from "../../../ChatFlowServices/BuildSendMessageService";
import Ticket from "../../../../models/Ticket";
import { v4 as uuidV4 } from "uuid";

export const getPreparo = async (
  chosenIndex: number,
  integracao: any,
  ticket: Ticket
) => {
  try {
    const url = `doProcedimentoPreparo?cd_procedimento=${chosenIndex}`;
    const URL_FINAL = `${integracao.config_json.baseUrl}${url}`;

    const instanceApi = await getApiInstance(integracao, true);
    const { data } = await instanceApi.post(URL_FINAL, {});

    if (!data[0].bb_preparo) {
      return null;
    }
    const blob = data[0].bb_preparo;

    const buffer = Buffer.from(blob, "base64");
    const publicFolder = path.join(process.cwd(), "public");
    const filePath = path.resolve(
      publicFolder,
      `Preparo exame_${chosenIndex}.html`
    );

    await fs.writeFile(filePath, buffer);
    // await BuildSendMessageService({
    //     ticket,
    //     tenantId: ticket.tenantId,
    //     msg: {
    //         type: 'MediaField',
    //         id: uuidV4(),
    //         data: {
    //             mediaUrl: `Preparo exame_${chosenIndex}.html`,
    //             name: 'Preparo Exame',
    //             message: {
    //                 mediaType: 'document'
    //             }
    //         }
    //     }
    // })
  } catch (error) {
    console.log(error);
  }
};
