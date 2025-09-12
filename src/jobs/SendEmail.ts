import { createTransporter } from "../providers/mail.provider";

export default {
  key: "SendEmail",
  options: {
    delay: 4000,
    attempts: 5,
    removeOnComplete: 2,
    removeOnFail: 5,
    // backoff: {
    // 	type: "fixed",
    // 	delay: 60000 * 3, // 3 min
    // },
  },
  async handle(data: any) {
    const { tenantId } = data;
    const { transporter, emailConfig } = await createTransporter(tenantId);
    console.log(emailConfig);
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
