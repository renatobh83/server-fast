import { AppError } from "../../../errors/errors.helper";
import Contact from "../../../models/Contact";

export const GetContactByNumber = async (number: string) => {
  try {
    const contact = await Contact.findOne({
      where: { serializednumber: number },
    });
    if (!contact) {
      throw new AppError("ERRO_CONCTAD_NO_FOUND", 404);
    }
    return contact.id;
  } catch (error) {}
};
