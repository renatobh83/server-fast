import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import CheckIsValidContact from "../WbotServices/Helpers/CheckIsValidContact";
import { CheckWappInitialized } from "../WbotServices/Helpers/CheckWappInitialized";

interface CreateContactData {
  name: string;
  number: string;
  email?: string;
  tenantId: number;
  identifier?: string;
}

export const CreateContactService = async ({
  name,
  number,
  email = "",
  tenantId,
  identifier,
}: CreateContactData): Promise<Contact> => {
  try {
    const wppInitialized = await CheckWappInitialized(tenantId);
    if (wppInitialized) {
      const dataContato = await CheckIsValidContact(number, tenantId);

      if (dataContato.isWAContact) {
        name =
          dataContato.pushname ||
          dataContato.verifiedName ||
          dataContato.name ||
          dataContato.formattedName;
      }
    }
    const contactExists = await Contact.findOne({
      where: {
        number,
        tenantId,
      },
    });

    if (contactExists) {
      throw new AppError("ERR_DUPLICATED_CONTACT", 400);
    }
    const contact = await Contact.create({
      name,
      number,
      email,
      tenantId,
      identifier,
    });
    await contact.reload({
      attributes: [
        "id",
        "name",
        "number",
        "email",
        "profilePicUrl",
        "tenantId",
        "identifier",
      ],
    });

    return contact;
  } catch (error) {
    console.log(error);
    throw new AppError("ERR_CREATE_CONTACT", 500);
  }
};
