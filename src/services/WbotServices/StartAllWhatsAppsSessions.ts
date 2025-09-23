import { Op } from "sequelize";
import Whatsapp from "../../models/Whatsapp";
import { StartWhatsAppSession } from "../StartWhatsAppSession";

export const StartAllWhatsAppsSessions = async (): Promise<void> => {
  // Busca apenas os campos necessários com filtros otimizados
  const whatsapps = await Whatsapp.findAll({
    where: {
      isActive: true,
      status: { [Op.notIn]: ["DISCONNECTED"] },
      [Op.or]: [
        {
          type: ["instagram", "telegram", "waba", "messenger"],
        },
        {
          type: "whatsapp",
          status: { [Op.notIn]: ["DISCONNECTED", "qrcode"] }, // Status diferente de "qrcode"
        },
      ],
    },
    attributes: ["id", "type", "status", "tokenTelegram", "tenantId", "name"], // Apenas campos necessários
    logging: console.log,
  });

  // Filtra sessões durante a query para evitar processamento adicional
  const telegramSessions = whatsapps.filter(
    (w) => w.type === "telegram" && w.tokenTelegram !== null
  );
  const whatsappSessions = whatsapps.filter((w) => w.type === "whatsapp");

  // Executa todas as sessões em paralelo com tratamento de errors individual
  await Promise.all([
    // ...telegramSessions.map((whatsapp) =>
    //   StartTbotSession(whatsapp).catch((error) =>
    //     console.error(`Telegram session error (ID: ${whatsapp.id}):`, error)
    //   )
    // ),
    ...whatsappSessions.map((whatsapp) =>
      StartWhatsAppSession(whatsapp).catch((error) =>
        console.error(`WhatsApp session error (ID: ${whatsapp.id}):`, error)
      )
    ),
  ]);
};
