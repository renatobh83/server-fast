// import Notificacao from "../../../../controllers/APIExternalController";
// import AppError from "../../../../errors/AppError";
// import GetIntegracaoById from "../../../../helpers/GetIntegracaoById";
// import { addJob } from "../../../../lib/Queue";
// import { getWbot } from "../../../../libs/wbot";
// import ApiConfig from "../../../../models/ApiConfig";
// import ProcessBodyData from "../../../../utils/ProcessBodyData";
// import ShowWhatsAppService from "../../../WhatsappService/ShowWhatsAppService";
// import { FindOrCreateConfirmacaoservice } from "./FindOrCreateConfirmacaoservice";

// interface Contato {
//   contato: string;
//   cliente: string;
//   idExterno: number;
//   notificacao: Notificacao;
// }

// interface ConfirmacaoProps {
//   apiId: string;
//   authToken: string;
//   idIntegracao: string;
//   contatos: Contato[];
// }
// export const ConfirmacaoIntegracaoService = async ({
//   apiId,
//   authToken,
//   contatos,
//   idIntegracao,
// }: ConfirmacaoProps) => {
//   const integracao = await GetIntegracaoById(idIntegracao);

//   const apiConfig = await ApiConfig.findOne({
//     where: {
//       id: apiId,
//       tenantId: integracao.tenantId,
//     },
//   });
//   if (!apiConfig) {
//     throw new AppError("ERR_SESSION_NOT_FOUND", 404);
//   }

//   const whatsapp = await ShowWhatsAppService({
//     id: apiConfig.get("sessionId"),
//     tenantId: apiConfig.get("tenantId"),
//     isInternal: true,
//   });

//   if (whatsapp.status === "DISCONNECTED") {
//     throw new AppError("ERR_SENDING_WAPP_MSG", 404);
//   }

//   const wbot = getWbot(apiConfig.get("sessionId"));
//   const bodyProcessed = ProcessBodyData(contatos[0]);
//   const idNumber = await wbot.checkNumberStatus(bodyProcessed.contato);

//   if (!idNumber.numberExists) {
//     return;
//   }
//   const ticketConfirmacao = await FindOrCreateConfirmacaoservice({
//     contato: bodyProcessed.contato,
//     bodyProcessed,
//     tenantId: integracao.tenantId,
//     idNumber,
//     integracaoId: integracao.id,
//   });

//   if (ticketConfirmacao.enviada) {
//     return;
//   }

//   const dataToJob = {
//     sessionId: apiConfig.get("sessionId"),
//     ticketConfirmacao,
//     bodyProcessed,
//   };

//   addJob("SendMessageConfirmar", dataToJob);
// };
