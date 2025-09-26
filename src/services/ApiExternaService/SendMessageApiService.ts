import { AppError } from "../../errors/errors.helper";
import { addJob } from "../../lib/Queue";
import ApiConfig from "../../models/ApiConfig";
import Contact from "../../models/Contact";

interface SendMessageChamadoServicesProps {
  apiId: string;
  sessionId: number;
  externalKey: string;
  tenantId: number;
  number: string;
  message: string;
}
export const sendMenssageApiService = async ({
  apiId,
  externalKey,
  message,
  number,
  sessionId,
  tenantId,
}: SendMessageChamadoServicesProps) => {
  try {
    const apiConfig = await ApiConfig.findOne({
      where: {
        id: apiId,
        tenantId,
        authToken: externalKey,
      },
      raw: true,
    });
    if (apiConfig?.sessionId !== Number(sessionId)) {
      throw new AppError("ERR_SESSION_NOT_AUTH_TOKEN", 403);
    }
    const messageData = {
      apiId,
      apiConfig,
      message,
      number,
      sessionId,
      tenantId,
    };
    addJob("SendMessageAPI", messageData);
  } catch (error) {
    console.log(error);
  }
};
