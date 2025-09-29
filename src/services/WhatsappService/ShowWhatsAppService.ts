import { AppError } from "../../errors/errors.helper";
import Whatsapp from "../../models/Whatsapp";

interface Data {
  id: string | number;
  tenantId?: string | number;
  isInternal?: boolean;
}

const ShowWhatsAppService = async ({
  id,
  tenantId,
}: Data): Promise<Whatsapp> => {
  const attr = [
    "id",
    "qrcode",
    "name",
    "status",
    "plugged",
    "isDefault",
    "tokenTelegram",
    "type",
    "createdAt",
    "updatedAt",
    "number",
    "phone",
    "tenantId",
    "wabaBSP",
    "tokenAPI",
    "farewellMessage",
    "chatFlowId",
    "pairingCode",
    "pairingCodeEnabled",
    "wppUser",
  ];

  const whatsapp = await Whatsapp.findByPk(id, {
    attributes: attr,
  });
  if (!whatsapp || (tenantId && whatsapp.tenantId !== tenantId)) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  return whatsapp;
};

export default ShowWhatsAppService;
