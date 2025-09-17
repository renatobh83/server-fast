import { Op } from "sequelize";
import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/scoket";

interface WhatsappData {
  name?: string;
  status?: string;
  session?: string;
  isDefault?: boolean;
  tokenTelegram?: string;
  pairingCodeEnabled?: boolean;
  isActive?: boolean;
  type?: "waba" | "instagram" | "telegram" | "whatsapp" | "messenger";
  wabaBSP?: string;
  tokenAPI?: string;
  chatFlowId?: number;
  wppUser?: string;
  qrcode?: string;
  retries?: number;
  phone?: string;
}

interface Request {
  whatsappData: WhatsappData;
  whatsappId: string;
  tenantId: string | number;
}

interface Response {
  whatsapp: Whatsapp;
  oldDefaultWhatsapp: Whatsapp | null;
}

const UpdateWhatsAppService = async ({
  whatsappData,
  whatsappId,
  tenantId,
}: Request): Promise<Response> => {
  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    isDefault: Yup.boolean(),
  });

  const {
    name,
    status,
    isDefault,
    session,
    tokenTelegram,
    isActive,
    wppUser,
    type,
    wabaBSP,
    tokenAPI,
    pairingCodeEnabled,
    chatFlowId,
    qrcode,
  } = whatsappData;
  const io = getIO();

  try {
    await schema.validate({ name, status, isDefault });

    let oldDefaultWhatsapp: Whatsapp | null = null;

    if (isDefault) {
      oldDefaultWhatsapp = await Whatsapp.findOne({
        where: { isDefault: true, tenantId, id: { [Op.not]: whatsappId } },
      });

      if (oldDefaultWhatsapp) {
        await oldDefaultWhatsapp.update({ isDefault: false });
      }
    }

    const whatsapp = await Whatsapp.findOne({
      where: { id: whatsappId, tenantId },
    });

    if (!whatsapp) {
      throw new AppError("ERR_NO_WAPP_FOUND", 404);
    }

    const data: WhatsappData = {
      name,
      status,
      session,
      isDefault,
      tokenTelegram,
      isActive,
      pairingCodeEnabled,
      wppUser,
      type,
      wabaBSP,
      tokenAPI,
      chatFlowId,
      qrcode,
    };
    await whatsapp.update(data);
    await whatsapp.reload();
    io.emit(`${tenantId}:whatsappSession`, {
      action: "update",
      session: whatsapp,
    });
    return { whatsapp, oldDefaultWhatsapp };
  } catch (err: any) {
    console.log(err);
    throw new AppError("ERRO_VALIDATE", 404);
  }
};

export default UpdateWhatsAppService;
