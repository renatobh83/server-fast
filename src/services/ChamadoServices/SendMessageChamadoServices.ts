import { AppError } from "../../errors/errors.helper";
import { addJob } from "../../lib/Queue";

export const SendMessageChamadoServices = async (data: any) => {
  try {
    const { tenantId, sendTo } = data;
    if (Array.isArray(sendTo)) {
      const mensagensParaEnviar: any[] = [];
      sendTo.forEach((para) => {
        const messasgeOptions = {
          ...data,
          sendTo: para,
          tenantId,
        };

        mensagensParaEnviar.push(messasgeOptions);
      });
      mensagensParaEnviar.forEach((options) =>
        addJob("SendMessageChamado", options)
      );
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_SEND_MESSAGE_CHAMADO_SERVICE", 502);
  }
};
