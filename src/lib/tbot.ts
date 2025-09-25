import { Telegraf } from "telegraf";

import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import { getIO } from "./socket";

interface Session extends Telegraf {
  id: number;
}

const TelegramSessions: Session[] = [];

/**
 * Lança o bot com tentativas de retry em caso de falha
 */
async function safeLaunch(tbot: Session, sessionName: string, retries = 3): Promise<void> {
  try {
    await tbot.launch();
    const botInfo = await tbot.telegram.getMe();
    logger.info(`🤖 Bot TELEGRAM (${sessionName}) iniciado como @${botInfo.username}`);
  } catch (err) {
    logger.error(`❌ Erro ao iniciar bot ${sessionName}: ${err}`);
    if (retries > 0) {
      logger.warn(`Tentando reiniciar ${sessionName} em 5s...`);
      setTimeout(() => safeLaunch(tbot, sessionName, retries - 1), 5000);
    }
  }
}

/**
 * Inicia uma sessão do Telegram
 */
export const initTbot = async (connection: Whatsapp): Promise<Session> => {
  return new Promise(async (resolve, reject) => {
    try {
      const io = getIO();
      const sessionName = connection.name;
      const { tenantId } = connection;

      const tbot = new Telegraf(connection.tokenTelegram) as Session;
      tbot.id = connection.id;

      // --- Tratamento de erros globais ---
      tbot.catch((err, ctx) => {
        logger.error(`Erro no bot ${sessionName} | ctx: ${ctx.updateType} | err: ${err}`);
      });

      tbot.on("polling_error", (err) => {
        logger.error(`Polling error em ${sessionName}: ${err.message}`);
      });

      // --- Armazena a sessão ---
      const sessionIndex = TelegramSessions.findIndex(s => s.id === connection.id);
      if (sessionIndex === -1) {
        TelegramSessions.push(tbot);
      } else {
        TelegramSessions[sessionIndex] = tbot;
      }

      // --- Lança o bot ---
      await safeLaunch(tbot, sessionName);

      await connection.update({
        status: "CONNECTED",
        qrcode: "",
        retries: 0,
      });

      io.emit(`${tenantId}:whatsappSession`, {
        action: "update",
        session: connection,
      });

      logger.info(`✅ Session TELEGRAM: ${sessionName} - READY`);
      resolve(tbot);
    } catch (error) {
      await connection.update({
        status: "DISCONNECTED",
        qrcode: "",
        retries: 0,
      });
      logger.error(`initTbot error | Error: ${error}`);
      reject(new Error("Error starting telegram session."));
    }
  });
};

/**
 * Retorna uma sessão ativa pelo ID
 */
export const getTbot = (whatsappId: number): Session | undefined => {
  const sessionIndex = TelegramSessions.findIndex((s) => s.id === whatsappId);
  return sessionIndex !== -1 ? TelegramSessions[sessionIndex] : undefined;
};

/**
 * Remove e para uma sessão
 */
export const removeTbot = (whatsappId: number): void => {
  try {
    const sessionIndex = TelegramSessions.findIndex((s) => s.id === whatsappId);
    if (sessionIndex !== -1) {
      const sessionSet = TelegramSessions[sessionIndex];
      sessionSet.stop("manual remove");
      TelegramSessions.splice(sessionIndex, 1);
      logger.info(`🛑 Telegram session ${whatsappId} removida com sucesso`);
    }
  } catch (err) {
    logger.error(`removeTbot | Error: ${err}`);
  }
};

/**
 * Encerramento gracioso das sessões ao matar o processo
 */
function registerProcessHandlers() {
  const shutdown = (signal: string) => {
    logger.warn(`⚠️ Recebido sinal ${signal}, encerrando sessões Telegram...`);
    TelegramSessions.forEach(bot => bot.stop(signal));
    process.exit(0);
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

// Registra apenas uma vez
registerProcessHandlers();
