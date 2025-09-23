import Whatsapp from "../../models/Whatsapp";

export const getWhatsAppDisconnect = async (): Promise<Whatsapp[]> => {
  const whatsapp = await Whatsapp.findAll({
    where: {
      type: "whatsapp",
    },
    raw: true,
    attributes: ["id", "tenantId"],
  });
  if (!whatsapp) {
    throw new Error("No");
  }

  return whatsapp;
};
