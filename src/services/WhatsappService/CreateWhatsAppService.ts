import { AppError } from "../../errors/errors.helper";
import { getIO } from "../../lib/socket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";

interface Request {
  name: string;
  status?: string;
  isDefault?: boolean;
  tenantId: number;
  wabaBSP?: string;
  wppUser?: string;
  tokenTelegram?: string;
  pairingCodeEnabled?: boolean;
  farewellMessage?: string;
  type: "waba" | "instagram" | "telegram" | "whatsapp" | "messenger";
}

const CreateWhatsAppService = async ({
  name,
  status = "DISCONNECTED",
  tenantId,
  pairingCodeEnabled,
  type,
  tokenTelegram,
  wppUser,
  isDefault = false,
  farewellMessage,
}: Request): Promise<Whatsapp> => {
  if (type === "telegram" && !tokenTelegram) {
    throw new AppError("Telegram: favor informar o Token.", 400);
  }

  const whatsappFound = await Whatsapp.findOne({
    where: { tenantId, isDefault: true },
  });

  if (!whatsappFound) {
    isDefault = !whatsappFound;
  }

  if (isDefault) {
    if (whatsappFound) {
      await whatsappFound.update({ isDefault: false });
    }
  }
  try {
    const whatsapp = await Whatsapp.create({
      name,
      status,
      isDefault,
      tenantId,
      type,
      pairingCodeEnabled: pairingCodeEnabled ? pairingCodeEnabled : false,
      wppUser,
      tokenTelegram,
      farewellMessage,
    });
    const io = getIO();
    io.emit(`${tenantId}:whatsapp`, {
      action: "update",
      whatsapp,
    });

    return whatsapp;
  } catch (error) {
    logger.error(error);
    throw new AppError("ERR_CREATE_WAPP", 404);
  }
};

export default CreateWhatsAppService;
