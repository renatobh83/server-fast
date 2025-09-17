import { addJob } from "../../lib/Queue";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import {
  gerarTemplateEmailClose,
  gerarTemplateEmailOpen,
} from "./TemplateHtml";

export const sendEmailOpenClose = async (chamado: any, conclusao?: any) => {
  const contatos = await Promise.all(
    chamado.contatoId.map(async (id: any) =>
      Contact.findByPk(id, {
        attributes: ["name", "email"],
        raw: true,
      })
    )
  );
  const userContato = contatos.map((u) => u?.name);
  const email = contatos
    .filter((e) => e.email) // Filtra apenas os contatos que têm email preenchido
    .map((e) => e.email); // Mapeia apenas os emails

  const { tenantId } =
    (await Empresa.findByPk(chamado.empresaId, {
      attributes: ["tenantId"],
      raw: true,
    })) || {};

  if (Array.isArray(email)) {
    const emailsParaEnviar: any[] = []; // Armazena as opções de email
    email.forEach((para, index) => {
      const user = userContato[index]; // Pega o usuário correspondente ao índice do email

      if (user) {
        const mailOptions = {
          tenantId,
          to: para,
          subject:
            chamado.status === "ABERTO" ? "Chamado aberto" : "Chamado Fechado",
          html:
            chamado.status === "ABERTO"
              ? gerarTemplateEmailOpen(chamado, user)
              : gerarTemplateEmailClose(chamado, user, conclusao),
        };

        emailsParaEnviar.push(mailOptions);
      }
    });

    // Enviar os emails (descomentar para usar)
    emailsParaEnviar.forEach((options) => addJob("SendEmail", options));
  }
};
