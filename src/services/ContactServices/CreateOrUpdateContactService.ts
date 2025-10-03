import { AppError } from "../../errors/errors.helper";
import socketEmit from "../../helpers/socketEmit";
import Contact from "../../models/Contact";
interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  extraInfo?: any[];
  tenantId: number;
  pushname: string;
  isUser: boolean;
  isWAContact: boolean;
  telegramId?: string;
  instagramPK?: number;
  messengerId?: string;
  origem?: "whatsapp" | "telegram" | "instagram" | "messenger";
  serializednumber?: string | undefined
  
}

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  tenantId,
  pushname,
  isUser,
  isWAContact,
  email = "",
  telegramId,
  instagramPK,
  messengerId,
  extraInfo,
  origem = "whatsapp",
  serializednumber
}: Request): Promise<Contact> => {
  try {
    // 🔹 Mapeamento dinâmico do campo de busca
    const originFieldMap: Record<string, { field: string; value: any }> = {
      whatsapp: { field: "serializednumber", value: serializednumber },
      telegram: { field: "telegramId", value: telegramId },
      instagram: { field: "instagramPK", value: instagramPK },
      messenger: { field: "messengerId", value: messengerId },
    };
    let contact: Contact | null = null;

    const uniqueValue = originFieldMap[origem];

    if (!uniqueValue) throw new AppError("ERR_INVALID_ORIGEM_VALUE", 400);

    if (contact) {
      return contact;
    }

    const { field, value } = originFieldMap[origem] || {};
    
    if (field && value) {
      contact = await Contact.findOne({ where: { [field]: value, tenantId } });
    }

    
    if (contact) {
      await contact.update({
        profilePicUrl,
        pushname,
        isUser,
        isWAContact,
        telegramId,
        instagramPK,
        messengerId,
      });
    } else {
      contact = await Contact.create({
        name,
        number: rawNumber,
        profilePicUrl,
        email,
        isGroup,
        pushname,
        isUser,
        isWAContact,
        tenantId,
        extraInfo,
        telegramId,
        instagramPK,
        messengerId,
        serializednumber,
      });
    }

    // 🔹 Emissão de evento socket
    socketEmit({
      tenantId,
      type: "contact:update",
      payload: contact,
    });

    return contact;
  } catch (err) {
    throw new AppError("ERR_CREATE_CONTACT", 500);
  }
};

export default CreateOrUpdateContactService;
