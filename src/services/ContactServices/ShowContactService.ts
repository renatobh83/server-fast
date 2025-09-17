import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";

interface Request {
  id: string | number;
  tenantId: string | number;
}

const ShowContactService = async ({
  id,
  tenantId,
}: Request): Promise<Contact> => {
  try {
    const contact = await Contact.findByPk(id);

    if (!contact || contact.tenantId !== tenantId) {
      throw new AppError("ERR_NO_CONTACT_FOUND", 404);
    }

    return contact;
  } catch (err: any) {
    throw new AppError("ERR_CONTACT", 500);
  }
};

export default ShowContactService;
