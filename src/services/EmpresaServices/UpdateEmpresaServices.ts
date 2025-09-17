import { Op } from "sequelize";
import Empresa from "../../models/Empresa";
import { AppError } from "../../errors/errors.helper";

interface IEmpresaUpdate {
  empresaId: number;
  address?: object;
  name?: string;
  active: boolean;
  identifier?: number;
  acessoExterno?: { ddns: string; ativo: boolean }[];
}

export const UpdateEmpresaServices = async ({
  empresaId,
  active,
  address,
  name,
  identifier,
  acessoExterno,
}: IEmpresaUpdate): Promise<Empresa | null> => {
  try {
    const company = await Empresa.findOne({
      where: { id: empresaId },
      attributes: [
        "id",
        "active",
        "address",
        "name",
        "identifier",
        "acessoExterno",
      ],
    });
    if (!company) {
      throw new AppError("ERR_COMPANY_NOT_FOUND", 404);
    }

    const isExistsIdentifier = await Empresa.findOne({
      where: { identifier, active: true, id: { [Op.ne]: empresaId } },
    });

    if (isExistsIdentifier) {
      throw new AppError("ERR_IDENTIFIER_ALREADY_EXISTS", 409);
    }
    await company.update({
      name,
      active,
      address,
      identifier,
      acessoExterno,
    });

    await company.reload({
      attributes: ["active", "address", "name", "identifier"],
    });

    return company;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ERR_UPDATE_CONMPANY_SERVICE", 500);
  }
};
