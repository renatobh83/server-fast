import { getIO } from "../lib/socket";
import { initWbot } from "../lib/wbot";
import { StartTbotSession } from "./TbotServices/StartTbotSession";

export const StartWhatsAppSession = async (whatsapp: any): Promise<void> => {
  await whatsapp.update({ status: "OPENING" });

  const io = getIO();
  io.emit(`${whatsapp.tenantId}:whatsappSession`, {
    action: "update",
    session: whatsapp,
  });
  try {
    if (whatsapp.type === "whatsapp") {
      await initWbot(whatsapp);
      // wbotMonitor(wbot, whatsapp);
    }
    if (whatsapp.type === "telegram") {
      StartTbotSession(whatsapp);
    }
  } catch (error) {
    console.log(error);
  }
};
