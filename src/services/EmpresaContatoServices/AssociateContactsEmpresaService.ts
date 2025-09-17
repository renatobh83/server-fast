import { AppError } from "../../errors/errors.helper";
import Empresa from "../../models/Empresa";

export const associateContactsEmpresaService = async (
  empresaId: number,
  contactIds: number[]
): Promise<Empresa> => {
  try {
    const empresa = await Empresa.findByPk(empresaId);

    if (!empresa) {
      throw new AppError("ERR_COMPANY_NOT_FOUND", 404);
    }

    if (contactIds.length === 0) {
      throw new AppError("ERRO_CONTACT_NO_FOUND", 404);
    }

    await empresa.setContacts(contactIds);

    await empresa.reload();
    return empresa;
    // console.log(`Contatos associados à empresa ${empresaId} com sucesso.`);
  } catch (err: any) {
    console.log(err);
    throw new AppError("ERR_ASSOCIATE_CONTACT_EMPRESA_SERVICE", 502);
  }
};
