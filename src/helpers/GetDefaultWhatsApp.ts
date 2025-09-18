import { AppError } from "../errors/errors.helper";
import Whatsapp from "../models/Whatsapp";

const GetDefaultWhatsApp = async (
  tenantId: string | number,
  channelId?: number,
  type?: string
): Promise<Whatsapp> => {
  const where: any = { tenantId, status: "CONNECTED" };

  if (channelId) {
    where.id = channelId;
  } else {
    where.type = type ? type : "whatsapp";
  }

  const defaultWhatsapp = await Whatsapp.findOne({
    where,
  });

  if (!defaultWhatsapp || !tenantId) {
    throw new AppError("ERR_NO_DEF_WAPP_FOUND", 404);
  }

  return defaultWhatsapp;
};

export default GetDefaultWhatsApp;
