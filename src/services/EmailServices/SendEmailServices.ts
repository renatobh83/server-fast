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
  isForgot?: boolean;
}

export const SendEmailServices = async ({
  to,
  subject,
  text,
  html,
  attachmentUrl,
  tenantId,
  isForgot,
}: EmailOptions) => {
  try {
    if (isForgot) {
      const mailOptions = {
        tenantId,
        to,
        subject,
        text,
        html,
        attachmentUrl,
      };
      await addJob("SendEmail", mailOptions);
      return;
    }
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
      console.log(emailsParaEnviar);
      // Enviar os emails (descomentar para usar)
      emailsParaEnviar.forEach((options) => addJob("SendEmail", options));
    } else {
      const mailOptions = {
        tenantId,
        to,
        subject,
        text,
        html:
          html === "teste" // 1. Nova verificação primeiro
            ? "Este e-mail é de teste" // 2. Se for verdade, use a string "teste"
            : attachmentUrl // 3. Se não, prossiga com a lógica anterior
            ? gerarTemplateEmailAnexo(html, html.username)
            : gerarTemplateEmail(html, html.username),
        attachmentUrl,
      };
      await addJob("SendEmail", mailOptions);
    }
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw new Error("Falha ao enviar e-mail");
  }
};
