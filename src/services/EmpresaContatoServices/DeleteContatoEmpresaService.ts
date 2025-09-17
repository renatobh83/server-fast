import { AppError } from "../../errors/errors.helper";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";

interface IDeleteEmpresaContactsService {
  empresaId: number;
  contactId: number;
}

export const DeleteContatoEmpresaService = async ({
  empresaId,
  contactId,
}: IDeleteEmpresaContactsService) => {
  try {
    const empresa = await Empresa.findByPk(empresaId);

    if (!empresa) {
      throw new AppError("ERR_NO_CAMPAIGN_NOT_FOUND", 404);
    }
    const contact = await Contact.findByPk(contactId);

    if (!contact) {
      throw new AppError("ERR_NO_CONTACT_NOT_FOUND", 404);
    }
    await empresa.removeContacts(contact);
    return true;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_DELETE_CONTACT_COMPANY", 500);
  }
};
