import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";

interface CreateContactData {
  name: string;
  number: string;
  email?: string;
  tenantId: number;
  identifier?: string;
  dtaniversario?: Date;
}

export const CreateContactService = async ({
  name,
  number,
  email = "",
  tenantId,
  identifier,
  dtaniversario,
}: CreateContactData): Promise<Contact> => {
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
    dtaniversario,
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

  // Criar Emmit
  return contact;
};
