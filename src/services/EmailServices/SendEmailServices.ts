import {
  gerarTemplateEmail,
  gerarTemplateEmailAnexo,
} from "../../helpers/emailTemplate.helper";
import { addJob } from "../../lib/Queue";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: any;
  tenantId?: number;
  attachmentUrl?: string;
}

export const SendEmailServices = async ({
  to,
  subject,
  text,
  html,
  attachmentUrl,
  tenantId,
}: EmailOptions) => {
  try {
    if (Array.isArray(to)) {
      const emailsParaEnviar: any[] = []; // Armazena as opções de email

      to.forEach((para, index) => {
        const user = html.username[index]; // Pega o usuário correspondente ao índice do email

        if (user) {
          const mailOptions = {
            tenantId,
            to: para,
            subject,
            text,
            html: attachmentUrl
              ? gerarTemplateEmailAnexo(html, user)
              : gerarTemplateEmail(html, user), // Usa o nome correto
            attachmentUrl,
          };

          emailsParaEnviar.push(mailOptions);
        }
      });

      // Verificar emails gerados corretamente

      // Enviar os emails (descomentar para usar)
      emailsParaEnviar.forEach((options) => addJob("SendEmail", options));
    } else {
      const mailOptions = {
        tenantId,
        to,
        subject,
        text,
        html,
        attachmentUrl,
      };

      addJob("SendEmail", mailOptions);
    }
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw new Error("Falha ao enviar e-mail");
  }
};
