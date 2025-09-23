import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import CheckIsValidContact from "../WbotServices/Helpers/CheckIsValidContact";
import { CheckWappInitialized } from "../WbotServices/Helpers/CheckWappInitialized";

interface ContactData {
  name: string;
  number: string;
  email: string;
  profilePicUrl: string;
  pushname: string;
  telegramId: number;
  identifier: string;
  serializednumber: string;
  isWAContact: boolean;
  isGroup: boolean;
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
      name,
      number,
      email,
      profilePicUrl,
      pushname,
      telegramId,
      identifier,
      serializednumber,
      isWAContact,
      isGroup,
    } = contactData;

    const wppInitialized = await CheckWappInitialized(tenantId);
    if (wppInitialized && !isGroup && isWAContact) {
      try {
        const dataContato = await CheckIsValidContact(
          serializednumber,
          tenantId
        );

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
      identifier,
      profilePicUrl,
      isWAContact,
    });

    await contact.reload({
      attributes: ["id", "name", "number", "email", "profilePicUrl"],
    });

    return contact;
  } catch (error: any) {
    console.log(error);
    throw new AppError("ERR_CONTACT", 500);
  }
};

export default UpdateContactSocketService;
