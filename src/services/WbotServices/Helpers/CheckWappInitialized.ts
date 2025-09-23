import Whatsapp from "../../../models/Whatsapp";

export const CheckWappInitialized = async (tenantId: number) => {
  try {
    const wpp = await Whatsapp.findOne({
      where: {
        tenantId,
        status: "CONNECTED",
        type: "whatsapp",
      },
    });
    if (!wpp) return false;
    return true;
  } catch (error) {
    return false;
  }
};
