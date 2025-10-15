import { logger } from "../utils/logger";
import Contact from "../models/Contact";
import GetDefaultWhatsApp from "../helpers/GetDefaultWhatsApp";
import mime from "mime-types";
import path from "node:path";
import fs from "node:fs";
import { AppError } from "../errors/errors.helper";
import { requireTbot } from "../lib/tbot";
import { getWbot } from "../lib/wbot";
export default {
  key: "SendMessageChamado",
  options: {
    delay: 1000,
    attempts: 1,
    removeOnComplete: 2,
    removeOnFail: 5,
  },

  async handle(data: any) {
    try {
      let message: any | null = null;
      const {
        tenantId,
        sendTo,
        comentario,
        chamado,
        assunto,
        tecnico,
        mediaUrl,
      } = data;

      const msg = {
        tenantId,
        sendTo,
        comentario,
        chamado,
        assunto,
        tecnico,
      };

      const contact = await Contact.findOne({ where: { number: sendTo } });
      if (!contact) {
        throw new AppError("Contato nao encontrado", 404);
      }

      if (contact.telegramId && contact.telegramId !== "0") {
        const defaultTelegram = await GetDefaultWhatsApp(
          tenantId,
          undefined,
          "telegram"
        );
        const tbot = requireTbot(defaultTelegram.id);
        if (mediaUrl) {
          const pastaPublic = path.join(process.cwd(), "public", "attachments");
          const url = path.basename(mediaUrl.url);
          const mediaPath = path.join(pastaPublic, url);
          if (fs.existsSync(mediaPath)) {
            const mimeType = mime.lookup(mediaPath);
            console.log(`Arquivo: ${url}, MIME Type detectado: ${mimeType}`);
            if (mimeType && mimeType.startsWith("image/")) {
              await tbot.telegram.sendPhoto(
                contact.telegramId,
                { source: mediaPath },
                {
                  caption: TemplateMessageMediUrl(msg, data.caption),
                }
              );
            } else if (mimeType && mimeType.startsWith("video/")) {
              message = await tbot.telegram.sendVideo(
                contact.telegramId,
                { source: mediaPath },
                {
                  caption: TemplateMessageMediUrl(msg, data.caption),
                }
              );
            } else if (mimeType && mimeType.startsWith("audio/")) {
              message = await tbot.telegram.sendAudio(
                contact.telegramId,
                { source: mediaPath },
                {
                  caption: TemplateMessageMediUrl(msg, data.caption),
                }
              );
            } else {
              message = await tbot.telegram.sendDocument(
                contact.telegramId,
                { source: mediaPath },
                {
                  caption: TemplateMessageMediUrl(msg, data.caption),
                }
              );
            }
          } else {
            message = await tbot.telegram.sendMessage(
              contact.telegramId,
              TemplateMessageMediUrl(
                msg,
                "Erro ao enviar o anexo favor entrar em contato."
              )
            );
          }
        } else {
          message = await tbot.telegram.sendMessage(
            contact.telegramId,
            TemplateMessage(msg)
          );
        }
      } else {
        const defaultWhatsapp = await GetDefaultWhatsApp(tenantId);
        const wbot = getWbot(defaultWhatsapp.id);
        if (mediaUrl) {
          const pastaPublic = path.join(process.cwd(), "public", "attachments");
          const url = path.basename(mediaUrl.url);
          const mediaPath = path.join(pastaPublic, url);
          if (fs.existsSync(mediaPath)) {
            const mimeType = mime.lookup(mediaPath);
            console.log(`Arquivo: ${url}, MIME Type detectado: ${mimeType}`);
            if (mimeType && mimeType.startsWith("image/")) {
              await wbot.sendImage(
                contact?.serializednumber!,
                mediaPath,
                url,
                TemplateMessageMediUrl(msg, data.caption)
              );
            } else {
              message = await wbot.sendFile(
                contact?.serializednumber!,
                mediaPath,
                {
                  caption: TemplateMessageMediUrl(msg, data.caption),
                }
              );
            }
          } else {
            message = await wbot.sendText(
              contact?.serializednumber!,
              TemplateMessageMediUrl(
                msg,
                "Erro ao enviar o anexo favor entrar em contato."
              ),
              {
                linkPreview: false,
              }
            );
          }
        } else {
          message = await wbot.sendText(
            contact?.serializednumber!,
            TemplateMessage(msg),
            {
              linkPreview: false,
            }
          );
        }
      }
      return {
        success: true,
        messageId: message ? message.id | message.message_id : null,
      };
    } catch (error: any) {
      console.log(error);
      logger.error({ message: "Error send message api", error });
      throw new Error(error);
    }
  },
};

const TemplateMessage = (data: any) => {
  const comentario = data.comentario;
  const idChamado = data.chamado;
  const assunto = data.assunto;
  const tecnico = data.tecnico;
  return `Olá,

Seu chamado foi atualizado com as seguintes informações:

🔹 ID do Chamado: ${idChamado}
🔹 Assunto: ${assunto}
🔹 Técnico Responsável: ${tecnico}

${comentario || "Nenhum comentário disponível"}

Caso tenha alguma dúvida ou precise de mais informações, estamos à disposição.

Atenciosamente,
[Nome da Equipe/Suporte]`;
};

const TemplateMessageMediUrl = (data: any, caption: string) => {
  const idChamado = data.chamado;
  const assunto = data.assunto;
  const tecnico = data.tecnico;
  return `Olá,

Seu chamado foi atualizado com as seguintes informações:

🔹 ID do Chamado: ${idChamado}
🔹 Assunto: ${assunto}
🔹 Técnico Responsável: ${tecnico}

${caption}

Caso tenha alguma dúvida ou precise de mais informações, estamos à disposição.

Atenciosamente,
[Nome da Equipe/Suporte]`;
};
