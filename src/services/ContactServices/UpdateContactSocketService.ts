import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import CheckIsValidContact from "../WbotServices/Helpers/CheckIsValidContact";
import { CheckWappInitialized } from "../WbotServices/Helpers/CheckWappInitialized";

interface ContactData {
  name: string;
  number: string;
  email?: string;
  dtaniversario?: Date | undefined;
  identifier?: string;
  telegramId?: number;
  isGroup?: boolean;
  empresas?: string;
  profilePicUrl?: any;
  isWAContact?: boolean;
  serializednumber?: string;
  id?: {
    user: string;
  };
}

interface Request {
  contactData: ContactData;
  contactId: number;
  tenantId: number;
}

const UpdateContactSocketService = async ({
  contactData,
  contactId,
  tenantId,
}: Request): Promise<Contact> => {
  try {
    let {
      email,
      name,
      number,
      empresas,
      dtaniversario,
      identifier,
      profilePicUrl,
      isWAContact,
      isGroup,
    } = contactData;

    const wppInitialized = await CheckWappInitialized(tenantId);
    if (wppInitialized && !isGroup && isWAContact) {
      try {
        const dataContato = await CheckIsValidContact(number!, tenantId);

        if (dataContato.isWAContact) {
          name = dataContato.pushname;
          profilePicUrl = dataContato.profilePicThumbObj.eurl;
          isWAContact = dataContato.isWAContact;
        } else {
          profilePicUrl = dataContato.eurl;
        }
      } catch (error: any) {
        throw new AppError(error.message, 500);
      }
    }

    const contact = await Contact.findOne({
      where: { id: contactId, tenantId },
      attributes: ["id", "name", "number", "email", "profilePicUrl"],
    });
    if (!contact) {
      throw new AppError("ERR_NO_CONTACT_FOUND", 404);
    }

    await contact.update({
      name,
      number,
      email,
      //   empresas: empresas,
      dtaniversario: dtaniversario,
      identifier,
      profilePicUrl,
      isWAContact,
    });

    await contact.reload({
      attributes: ["id", "name", "number", "email", "profilePicUrl"],
    });

    return contact;
  } catch (error: any) {
    throw new AppError("ERR_CONTACT", 500);
  }
};

export default UpdateContactSocketService;
