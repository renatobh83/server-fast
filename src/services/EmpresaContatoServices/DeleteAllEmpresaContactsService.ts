import { AppError } from "../../errors/errors.helper";
import Empresa from "../../models/Empresa";
import EmpresaContact from "../../models/EmpresaContact";
import { logger } from "../../utils/logger";

interface IDeleteEmpresaContactsService {
  empresaId: number;
}

export const DeleteAllEmpresaContactsService = async ({
  empresaId,
}: IDeleteEmpresaContactsService) => {
  try {
    const empresa = await Empresa.findByPk(empresaId);

    if (!empresa) {
      throw new AppError("ERR_NO_CAMPAIGN_NOT_FOUND", 404);
    }

    await EmpresaContact.destroy({
      where: {
        empresaId: empresa.id,
      },
    });
    logger.info("Todos os contatos foram removidos da empresa.");
    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_DELETE_CONTACT_COMPANY", 404);
  }
};
