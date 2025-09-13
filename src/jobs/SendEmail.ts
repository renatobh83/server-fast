import { createTransporter } from "../providers/mail.provider";
import path from "node:path";
import fs from "node:fs";
import { logger } from "../utils/logger";

export default {
  key: "SendEmail",
  options: {
    delay: 4000,
    attempts: 5,
    removeOnComplete: 5,
    removeOnFail: 5,

  },
  async handle(data: any) {
         logger.info("SendEmail Initiated");
    const { tenantId } = data;
    
    const { transporter, emailConfig } = await createTransporter(tenantId);
      const filename = getFilenameFromUrl(data.attachmentUrl);
      const pastaPublic = path.join(process.cwd(), "public", "attachments");
      const mediaPath = path.join(pastaPublic, filename);
       const mailOptions = {
        from: emailConfig.email,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
        attachments: data.attachmentUrl
          ? [
              {
                filename: getFilenameFromUrl(data.attachmentUrl),
                content: fs.createReadStream(mediaPath),
              },
            ]
          : [],
      };
      //  const info = await transporter.sendMail(mailOptions);
      logger.info("Finalized SendEmail ");
      return true
  },
};

const getFilenameFromUrl = (url: string): string => {
  try {
    const partes = url.split("/");
    const ultimaParte = partes.findLast((parte) => parte.includes("."));
    return decodeURIComponent(ultimaParte || "anexo");
  } catch {
    return "anexo";
  }
};
