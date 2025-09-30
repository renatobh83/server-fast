import { createTransporter } from "../providers/mail.provider";
import path from "node:path";
import fs from "node:fs";
import { logger } from "../utils/logger";

export default {
  key: "SendEmail",
  options: {
    delay: 4000,
    attempts: 3,
    removeOnComplete: 5,
    removeOnFail: 5,
  },
  async handle(data: any) {
    logger.info("SendEmail Initiated");
    // =================================================================
    // INÍCIO DO TESTE DE DEPURAÇÃO
    // =================================================================
    logger.info("--- INICIANDO TESTE DE DEPURAÇÃO ---");
    logger.info("Dados recebidos pelo job:", JSON.stringify(data, null, 2));

    const { tenantId } = data;
    const { transporter, emailConfig } = await createTransporter(tenantId);

    // 1. Vamos definir o caminho do anexo manualmente.
    //    Pegue o nome do arquivo do seu log de erro anterior para garantir que ele existe.
    const filename = "chat bot new.json";
    const pastaPublic = path.join(process.cwd(), "public", "attachments");
    const mediaPath = path.join(pastaPublic, filename);

    logger.info(`Caminho do anexo (codificado): ${mediaPath}`);

    // 2. Verifique se o arquivo realmente existe neste caminho
    if (!fs.existsSync(mediaPath)) {
      const errorMsg = `DEPURAÇÃO: Arquivo codificado não encontrado em ${mediaPath}. O teste não pode continuar.`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 3. Crie o objeto de anexo usando a propriedade 'path'.
    const hardcodedAttachment = [
      {
        filename: filename,
        path: mediaPath,
      },
    ];
    const mailOptions = {
      from: emailConfig.email,
      to: data.to, // Usando o destinatário do job
      subject: data.subject,
      text: data.text,
      html: data.html,
      attachments: hardcodedAttachment, // USANDO O ANEXO CODIFICADO
    };

    logger.info(
      "Opções de e-mail antes do envio:",
      JSON.stringify(mailOptions, null, 2)
    );
    // =================================================================
    // FIM DO TESTE DE DEPURAÇÃO
    // =================================================================

    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info("E-mail de teste enviado com sucesso!", info);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(
        "DEPURAÇÃO: O erro ocorreu mesmo com o anexo codificado.",
        error
      );
      throw error;
    }
  },
};

// A função getFilenameFromUrl não é usada neste teste, mas pode permanecer.
const getFilenameFromUrl = (url: string): string => {
  if (!url) return "anexo";
  try {
    const partes = url.split("/");
    const ultimaParte = partes[partes.length - 1];
    return decodeURIComponent(ultimaParte || "anexo");
  } catch {
    return "anexo";
  }
};
