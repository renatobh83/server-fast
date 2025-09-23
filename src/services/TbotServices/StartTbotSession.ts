import { AppError } from "../../errors/errors.helper";
import { getIO } from "../../lib/socket";
import { initTbot } from "../../lib/tbot";

import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { tbotMessageListener } from "./tbotMessageListener";

export const StartTbotSession = async (connection: Whatsapp): Promise<void> => {
  const io = getIO();
  await connection.update({ status: "OPENING" });
  io.emit(`${connection.tenantId}:whatsappSession`, {
    action: "update",
    session: connection,
  });

  try {
    const tbot = await initTbot(connection);
    tbotMessageListener(tbot);
  } catch (err: any) {
    logger.error(`StartTbotSession | Error: ${err}`);
    throw new AppError("ERRP_START_TBOT_SESSION", 500);
  }
};
