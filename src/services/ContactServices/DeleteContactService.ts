import { AppError } from "../../errors/errors.helper";
import socketEmit from "../../helpers/socketEmit";
import Contact from "../../models/Contact";
import Empresa from "../../models/Empresa";
import EmpresaContact from "../../models/EmpresaContact";

interface Request {
  id: string | number;
  tenantId: string | number;
}

const DeleteContactService = async ({
  id,
  tenantId,
}: Request): Promise<void> => {
  try {
    const contact = await Contact.findOne({
      where: { id, tenantId },
      include: { model: Empresa, as: "empresa" },
    });

    if (!contact) {
      throw new AppError("ERR_NO_CONTACT_FOUND", 404);
    }
    await EmpresaContact.destroy({
      where: { contactId: id },
    });

    await contact.destroy();

    socketEmit({
      tenantId,
      type: "contact:delete",
      payload: contact,
    });
  } catch (error: any) {
    console.log(error);
    throw new AppError("ERR_DELETE_CONTACT", 502);
  }
};

export default DeleteContactService;
