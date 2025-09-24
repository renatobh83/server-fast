import Whatsapp from "../../../models/Whatsapp";

const GetWhatsAppForUpdate = async (
  tenantId: string | number,
  channelId?: number,
  type?: string
): Promise<Whatsapp | boolean> => {
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
    return false;
  }

  return defaultWhatsapp;
};

export default GetWhatsAppForUpdate;
