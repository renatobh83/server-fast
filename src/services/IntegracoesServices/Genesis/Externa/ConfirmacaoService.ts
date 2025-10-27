import { AppError } from "../../../../errors/errors.helper";
import GetIntegracaoById from "../../../../helpers/GetIntegracaoById";
import { addJob } from "../../../../lib/Queue";
import { getWbot } from "../../../../lib/wbot";
import ApiConfig from "../../../../models/ApiConfig";
import ProcessBodyData from "../../../../utils/ProcessBodyData";
import ShowWhatsAppService from "../../../WhatsappService/ShowWhatsAppService";
import { FindOrCreateConfirmacaoservice } from "./FindOrCreateConfirmacaoservice";

interface ConfirmacaoProps {
  contato: string;
  cliente: string;
  idExterno: number;
  notificacao: object;
  apiId: string;
  idIntegracao: string;
  authToken: string;
}

export const ConfirmacaoIntegracaoService = async ({
  apiId,

  contato,
  notificacao,
  idIntegracao,
}: ConfirmacaoProps) => {
  const integracao = await GetIntegracaoById(idIntegracao);
  const apiConfig = await ApiConfig.findOne({
    where: {
      id: apiId,
      tenantId: integracao.tenantId,
    },
  });
  if (!apiConfig) {
    throw new AppError("ERR_SESSION_NOT_FOUND", 404);
  }

  const whatsapp = await ShowWhatsAppService({
    id: apiConfig.get("sessionId"),
    tenantId: apiConfig.get("tenantId"),
    isInternal: true,
  });

  if (whatsapp.status === "DISCONNECTED") {
    throw new AppError("ERR_SENDING_WAPP_MSG_CHANNEL_DISCONNECTED", 400);
  }

  const wbot = getWbot(apiConfig.get("sessionId"));
  const bodyProcessed = ProcessBodyData(notificacao);

  const idNumber = await wbot.checkNumberStatus(contato);

  if (!idNumber.numberExists) {
    throw new AppError("ERR_SENDING_WAPP_NUMBER_NO_FOUND", 404);
  }

  const ticket = await FindOrCreateConfirmacaoservice({
    bodyProcessed,
    tenantId: integracao.tenantId,
    contato,
    idNumber,
    integracaoId: idIntegracao,
  });

  if (ticket.enviada) {
    throw new AppError("ERR_SENDING_WAPP_MESSAGE_ALREADY_SENDED", 400);
  }

  const dataToJob = {
    sessionId: apiConfig.get("sessionId"),
    ticket,
    bodyProcessed,
  };

  addJob("SendMessageConfirmar", dataToJob);
};
