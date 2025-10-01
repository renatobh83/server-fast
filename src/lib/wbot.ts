import path from "node:path";
import fs, { promises } from "node:fs";
import { Whatsapp, create, defaultOptions } from "wbotconnect";
import { AppError } from "../errors/errors.helper";
import { getIO } from "./socket";
import { logger } from "../utils/logger";
import { wbotMessageListener } from "../services/WbotServices/wbotMessageListener";
interface Session extends Whatsapp {
  id: number;
}

const sessions: Session[] = [];
let sessionName: string;
let tenantId: string;
let whatsappSession: any;

export const initWbot = async (whatsapp: any): Promise<Session> => {
  const io = getIO();
  let wbot: Session;
  tenantId = whatsapp.tenantId;
  whatsappSession = whatsapp;
  sessionName = whatsapp.name;

  const qrCodePath = path.join(
    __dirname,
    "..",
    "..",
    "public",
    `qrCode-${whatsapp.id}.png`
  );
  try {
    const options = {
      headless: true,
      phoneNumber: whatsapp.pairingCodeEnabled ? whatsapp.wppUser : null,
      puppeteerOptions: {
        userDataDir: "./userDataDir/" + whatsapp.name,
      },
    };
    const mergedOptions = { ...defaultOptions, ...options };

    wbot = (await create(
      Object.assign({}, mergedOptions, {
        session: whatsapp.id,
        phoneNumber: whatsapp.pairingCodeEnabled ? whatsapp.wppUser : null,
        catchLinkCode: async (code: string) => {
          await whatsapp.update({
            pairingCode: code,
            status: "qrcode",
            retries: 0,
          });
          io.emit(`${tenantId}:whatsappSession`, {
            action: "update",
            session: whatsapp,
          });
        },
        catchQR: async (
          base64Qrimg: any,
          asciiQR: any,
          attempts: any,
          urlCode: any
        ) => {
          const matches = base64Qrimg.match(
            /^data:([A-Za-z-+/]+);base64,(.+)$/
          );
          if (!matches || matches.length !== 3) {
            throw new Error("Invalid input string");
          }
          logger.info(
            `Session QR CODE: ${`wbot-${whatsapp.id}`}-ID: ${whatsapp.id}-${
              whatsapp.status
            }`
          );

          await whatsapp.update({
            qrcode: urlCode,
            status: "qrcode",
            retries: attempts,
          });
          const response = {
            type: matches[1],
            data: Buffer.from(matches[2], "base64"),
          };
          fs.writeFile(qrCodePath, response.data, "binary", (err) => {
            if (err) {
              console.error("Erro ao salvar QR Code:", err);
            }
          });
          io.emit(`${tenantId}:whatsappSession`, {
            action: "update",
            session: whatsapp,
          });
        },
        statusFind: async (statusSession: string, _session: string) => {
          if (statusSession === "autocloseCalled") {
            whatsapp.update({
              status: "DISCONNECTED",
              qrcode: "",
              retries: 0,
              phone: "",
              session: "",
              pairingCode: "",
            });
            io.emit(`${tenantId}:whatsappSession`, {
              action: "close",
              session: whatsapp,
            });
          }
          if (statusSession === "qrReadFail") {
            logger.error(`Session: ${sessionName}-AUTHENTICATION FAILURE`);
            if (whatsapp.retries > 1) {
              await whatsapp.update({
                retries: 0,
                session: "",
              });
            }
            const retry = whatsapp.retries;
            await whatsapp.update({
              status: "DISCONNECTED",
              retries: retry + 1,
            });
            io.emit(`${tenantId}:whatsappSession`, {
              action: "update",
              session: whatsapp,
            });
          }
          if (
            statusSession === "desconnectedMobile" ||
            statusSession === "browserClose"
          ) {
            const sessionIndex = sessions.findIndex(
              (s) => Number(s.id) === Number(whatsapp.id)
            );

            if (sessionIndex !== -1) {
              whatsapp.update({
                status: "DISCONNECTED",
                qrcode: "",
                retries: 0,
                phone: "",
                session: "",
                pairingCode: "",
              });
              io.emit(`${tenantId}:whatsappSession`, {
                action: "update",
                session: whatsapp,
              });
              sessions.splice(sessionIndex, 1);
            }
          }
          if (statusSession === "inChat") {
            if (fs.existsSync(qrCodePath)) {
              fs.unlink(qrCodePath, () => {});
            }
          }
          if (statusSession === "serverClose") {
            const sessionIndex = sessions.findIndex(
              (s) => Number(s.id) === Number(whatsapp.id)
            );

            if (sessionIndex !== -1) {
              whatsapp.update({
                status: "DISCONNECTED",
                qrcode: "",
                retries: 0,
                phone: "",
                session: "",
                pairingCode: "",
              });
              io.emit(`${tenantId}:whatsappSession`, {
                action: "update",
                session: whatsapp,
              });
              sessions.splice(sessionIndex, 1);
            }
          }
        },
      })
    )) as unknown as Session;
    await start(wbot, io);
    const sessionIndex = sessions.findIndex((s) => s.id === whatsapp.id);
    if (sessionIndex === -1) {
      wbot.id = whatsapp.id;
      sessions.push(wbot);
    } else {
      sessions[sessionIndex] = wbot;
    }
    return wbot;
  } catch (error) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

async function waitForApiValue(apiCall: Session, interval = 1000) {
  return new Promise((resolve, reject) => {
    const checkValue = async () => {
      try {
        const profileSession = await apiCall.getProfileName();
        const wbotVersion = await apiCall.getWAVersion();
        const number = await apiCall.getWid();
        const result = {
          wbotVersion,
          profileSession,
          number,
        };

        if (result !== null) {
          resolve(result); // Retorna o valor assim que não for null
        } else {
          setTimeout(checkValue, interval); // Recheca após o intervalo
        }
      } catch (error) {
        reject(error); // Rejeita a promise em caso de erro
      }
    };
    checkValue(); // Inicia a verificação
  });
}
const start = async (client: Session, io: any) => {
  try {
    const isReady = await client.isAuthenticated();
    if (isReady) {
      logger.info(`Session: ${sessionName} AUTHENTICATED`);

      const profileSession = await waitForApiValue(client, 1000);
      await whatsappSession.update({
        status: "CONNECTED",
        qrcode: "",
        retries: 0,
        // number: wbot?.info?.wid?.user, // || wbot?.info?.me?.user,
        phone: profileSession,
        session: sessionName,
        pairingCode: "",
      });
      io.emit(`${tenantId}:whatsappSession`, {
        action: "update",
        session: whatsappSession,
      });
      io.emit(`${tenantId}:whatsappSession`, {
        action: "readySession",
        session: whatsappSession,
      });
      wbotMessageListener(client);
    }
  } catch (_error) {}
};

async function removeSession(session: string) {
  try {
    // Defina o caminho da pasta com base no sessionId
    const sessionPath = path.join(
      __dirname,
      "..",
      "..",
      "userDataDir",
      session
    );
    // Verifique se a pasta existe
    try {
      await promises.access(sessionPath); // Verifica se o caminho é acessível
    } catch {
      // Se não existir, encerre a função
      return;
    }

    // Remova a pasta e todos os seus arquivos
    await promises.rm(sessionPath, { recursive: true, force: true }); // Aguarda a remoção
  } catch (error) {
    logger.error(`Erro ao remover a pasta da sessão ${session}:`, error);
  }
}
export const removeWbot = async (whatsappId: number): Promise<void> => {
  try {
    const io = getIO();
    const sessionIndex = sessions.findIndex((s) => s.id === whatsappId);
    if (sessionIndex !== -1) {
      removeSession(whatsappSession.name);
      whatsappSession.update({
        status: "DISCONNECTED",
        qrcode: "",
        retries: 0,
        phone: "",
        session: "",
        pairingCode: "",
      });
      io.emit(`${tenantId}:whatsappSession`, {
        action: "update",
        session: whatsappSession,
      });
      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(`removeWbot | Error: ${err}`);
  }
};

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex((s) => s.id === Number(whatsappId));
  if (sessionIndex === -1) {
    throw new Error("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};
