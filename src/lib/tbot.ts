import { Telegraf } from "telegraf";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import { getIO } from "./socket";

interface Session extends Telegraf {
  id: number;
}

const TelegramSessions: Session[] = [];
let processHandlersRegistered = false;

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Tenta lançar o bot e, se falhar, refaz até maxRetries.
 * Se todas as tentativas falharem, lança o último erro.
 */
async function safeLaunch(
  tbot: Session,
  sessionName: string,
  maxRetries = 3,
  delayMs = 5000
): Promise<void> {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await tbot.launch();
      const botInfo = await tbot.telegram.getMe();
      logger.info(`🤖 Bot TELEGRAM (${sessionName}) iniciado como @${botInfo.username}`);
      return;
    } catch (err) {
      lastErr = err;
      logger.error(`❌ Erro ao iniciar bot ${sessionName} (attempt ${attempt}/${maxRetries}): ${err}`);
      if (attempt < maxRetries) {
        logger.warn(`Tentando reiniciar ${sessionName} em ${delayMs / 1000}s...`);
        await sleep(delayMs);
      }
    }
  }
  logger.error(`Falha ao iniciar ${sessionName} após ${maxRetries} tentativas.`);
  throw lastErr ?? new Error("Failed to launch telegraf bot");
}

/**
 * Inicia uma sessão do Telegram. Se o launch falhar, faz cleanup e lança erro.
 */
export const initTbot = async (connection: Whatsapp): Promise<Session> => {
  const io = getIO();
  const sessionName = connection.name;
  const { tenantId } = connection;

  const tbot = new Telegraf(connection.tokenTelegram) as Session;
  tbot.id = connection.id;

  // captura erros por update
  tbot.catch((err: any, ctx: any) => {
    logger.error(`Erro no bot ${sessionName} | ctx: ${ctx?.updateType} | err: ${err}`);
  });

  // guarda a sessão *antes* do launch para que outras partes possam encontrá-la
  const sessionIndex = TelegramSessions.findIndex(s => s.id === connection.id);
  if (sessionIndex === -1) TelegramSessions.push(tbot);
  else TelegramSessions[sessionIndex] = tbot;

  try {
    await safeLaunch(tbot, sessionName);
    await connection.update({ status: "CONNECTED", qrcode: "", retries: 0 });
    io.emit(`${tenantId}:whatsappSession`, { action: "update", session: connection });
    logger.info(`✅ Session TELEGRAM: ${sessionName} - READY`);

    // registrar handlers do processo só uma vez
    registerProcessHandlers();

    return tbot;
  } catch (err) {
    // se falhar ao lançar, remover a sessão guardada (cleanup)
    const idx = TelegramSessions.findIndex(s => s.id === connection.id);
    if (idx !== -1) TelegramSessions.splice(idx, 1);

    await connection.update({ status: "DISCONNECTED", qrcode: "", retries: 0 });
    logger.error(`initTbot error | ${err}`);
    throw err;
  }
};

export const getTbot = (whatsappId: number): Session | undefined => {
  return TelegramSessions.find(s => s.id === whatsappId);
};

/**
 * Retorna a sessão ou lança erro (útil quando você *precisa* do bot)
 */
export const requireTbot = (whatsappId: number): Session => {
  const tbot = getTbot(whatsappId);
  if (!tbot) throw new Error(`Telegram bot da sessão ${whatsappId} não encontrado`);
  return tbot;
};

/**
 * Garante que exista uma sessão: retorna se existir, senão tenta recriar via initTbot.
 * Útil para jobs/filas que podem rodar antes do initTbot.
 */
export const ensureTbot = async (whatsappId: number): Promise<Session> => {
  const existing = getTbot(whatsappId);
  if (existing) return existing;

  const connection = await Whatsapp.findByPk(whatsappId);
  if (!connection) throw new Error(`Connection not found ${whatsappId}`);
  return initTbot(connection);
};

export const removeTbot = (whatsappId: number): void => {
  const idx = TelegramSessions.findIndex(s => s.id === whatsappId);
  if (idx !== -1) {
    try {
      TelegramSessions[idx].stop("manual remove");
    } catch (err) {
      logger.error(`Error stopping session ${whatsappId}: ${err}`);
    }
    TelegramSessions.splice(idx, 1);
    logger.info(`🛑 Telegram session ${whatsappId} removida`);
  }
};

function registerProcessHandlers() {
  if (processHandlersRegistered) return;
  processHandlersRegistered = true;

  const shutdown = (signal: string) => {
    logger.warn(`⚠️ Recebido sinal ${signal}, encerrando sessões Telegram...`);
    TelegramSessions.forEach(bot => {
      try { bot.stop(signal); } catch (e) { logger.warn(`failed stop bot: ${e}`); }
    });
    process.exit(0);
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
  });
  process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err}`);
  });
}
