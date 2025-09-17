import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";

export interface ContactDataUpdate {
  email?: string;
  number?: string;
  name?: string;
  telegramId?: string;
  dtaniversario?: Date | undefined;
  empresa?: Empresa[];
  identifier?: string;
  profilePicUrl?: string;
  isWAContact?: boolean;
}

interface Request {
  contactData: ContactDataUpdate;
  contactId: number;
  tenantId: number;
}

const UpdateContactService = async ({
  contactData,
  contactId,
  tenantId,
}: Request): Promise<Contact> => {
  const {
    email,
    name,
    number,
    empresa,
    dtaniversario,
    identifier,
    telegramId,
    profilePicUrl,
    isWAContact,
  } = contactData;

  try {
    const contact = await Contact.findOne({
      where: { id: contactId, tenantId },
      attributes: [
        "id",
        "name",
        "number",
        "email",
        "profilePicUrl",
        "telegramId",
      ],
    });
    if (!contact) {
      throw new AppError("ERR_NO_CONTACT_FOUND", 404);
    }

    await contact.update({
      name,
      number,
      email,
      empresas: empresa,
      dtaniversario: dtaniversario,
      identifier,
      profilePicUrl,
      isWAContact,
      telegramId,
    });

    await contact.reload({
      attributes: ["id", "name", "number", "email", "profilePicUrl"],
    });

    // socketEmit({
    // 	tenantId,
    // 	type: "contact:update",
    // 	payload: contact,
    // });

    return contact;
  } catch (error: any) {
    throw new AppError("ERR_CONTACT", 500);
  }
};

export default UpdateContactService;
